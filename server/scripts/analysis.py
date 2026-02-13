"""
KRA API 기반 경마 분석 스크립트 (KRA_ANALYSIS_STRATEGY.md 연동)

- calculate_score: 기존 말 기준 점수 (pandas 사용)
- calculate_jockey_score: 기수 점수 (마칠기삼)
- get_weight_ratio: 말 vs 기수 가중치
- analyze_jockey: 2단계 필터링 통합 분석
"""
import sys
import json


def calculate_jockey_score(jockey: dict) -> float:
    """
    기수 점수 산출 (KRA_ANALYSIS_STRATEGY.md 4.2)
    winRateTsum, quRateTsum, rcCntT 기반
    """
    win_rate = float(jockey.get("winRateTsum", 0) or 0)
    qu_rate = float(jockey.get("quRateTsum", 0) or 0)
    rc_cnt = int(jockey.get("rcCntT", 0) or 0)

    # experienceScore: 100회 미만=0.5, 1000회 이상=1.0
    if rc_cnt >= 1000:
        exp_score = 1.0
    else:
        exp_score = 0.5 + rc_cnt / 2000  # 0~500회: 0.5~0.75

    if rc_cnt < 100:
        exp_score *= 0.9  # 신인 감점

    # jockeyScore: 0~100 스케일 (승률 15%, 복승률 30% = 약 24)
    score = win_rate * 0.4 + qu_rate * 0.4 + exp_score * 20
    return round(min(100, max(0, score)), 2)


def get_weight_ratio(race: dict, entries: list, results: list = None) -> tuple:
    """
    말 vs 기수 가중치 (KRA_ANALYSIS_STRATEGY.md 5)
    - 혼전: 기록 차이 0.5초 이내 → 50/50
    - 특수: 비/장거리 → 60/40
    - 일반: 70/30
    """
    weather = str(race.get("weather") or "").strip()
    rc_dist = int(race.get("rcDist") or 0)


    def parse_time(val):
        if val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    # 혼전 판별: 기록/레이팅 차이가 작으면 비슷한 말들
    is_close = False
    if results and len(results) > 0:
        times = [parse_time(r.get("rcTime")) for r in results[:5]]
        times = [t for t in times if t is not None]
        is_close = len(times) >= 2 and (max(times) - min(times)) <= 0.5
    else:
        ratings = [float(r.get("rating") or 0) for r in entries[:5]]
        ratings = [r for r in ratings if r > 0]
        if len(ratings) >= 2:
            is_close = max(ratings) - min(ratings) <= 15  # 15점 이내 = 혼전
    is_special = weather != "맑음" or rc_dist >= 1800

    if is_close:
        return 0.5, 0.5
    if is_special:
        return 0.6, 0.4
    return 0.7, 0.3


def analyze_jockey(data: dict) -> dict:
    """
    2단계 필터링 통합 분석 (KRA_ANALYSIS_STRATEGY.md 6)
    Input: { race, entries, jockeyMap, results? }
    Output: { entriesWithScores, weightRatio, topPickByJockey }
    """
    race = data.get("race", {})
    entries = data.get("entries", [])
    jockey_map = data.get("jockeyMap", {})  # { meet_jkNo: {...} }
    results = data.get("results", [])

    meet = str(race.get("meet", "1"))
    if meet in ("서울", "Seoul"):
        meet = "1"
    elif meet in ("제주", "Jeju"):
        meet = "2"
    elif meet in ("부산", "부경", "Busan"):
        meet = "3"

    horse_weight, jockey_weight = get_weight_ratio(race, entries, results)

    entries_with_scores = []
    for e in entries:
        jk_no = e.get("jkNo") or ""
        key = f"{meet}_{jk_no}"
        jockey = jockey_map.get(key)

        jockey_score = 0.0
        if jockey:
            jockey_score = calculate_jockey_score(jockey)

        rating = float(e.get("rating") or 0)
        horse_score = (rating / 100) * 100 if rating else 50  # 0~100 대략

        combined = horse_score * horse_weight + jockey_score * jockey_weight
        entries_with_scores.append({
            "hrNo": e.get("hrNo"),
            "hrName": e.get("hrName"),
            "jkNo": jk_no,
            "jkName": e.get("jkName"),
            "horseScore": round(horse_score, 2),
            "jockeyScore": round(jockey_score, 2),
            "combinedScore": round(combined, 2),
        })

    if not entries_with_scores:
        return {
            "entriesWithScores": [],
            "weightRatio": {"horse": horse_weight, "jockey": jockey_weight},
            "topPickByJockey": None,
        }

    by_jockey = sorted(entries_with_scores, key=lambda x: x["jockeyScore"], reverse=True)
    top_by_jockey = by_jockey[0] if by_jockey else None

    return {
        "entriesWithScores": entries_with_scores,
        "weightRatio": {"horse": horse_weight, "jockey": jockey_weight},
        "topPickByJockey": top_by_jockey,
    }


def _parse_recent_ranks(val):
    """recentRanks: [1,5,2] 등. 리스트로 변환."""
    if val is None:
        return []
    if isinstance(val, list):
        return [int(x) for x in val if isinstance(x, (int, float)) and not (isinstance(x, float) and x != int(x))]
    if isinstance(val, str):
        try:
            import json
            parsed = json.loads(val)
            return _parse_recent_ranks(parsed)
        except Exception:
            return []
    return []


def _momentum_score(recent_ranks: list) -> float:
    """
    Momentum Score (기세 지수) — BUSINESS_LOGIC 1.2
    최근 3경기 착순 반영. 최근일수록 가중치 높음.
    가중치: 최근1경기 0.5, 2경기 0.3, 3경기 0.2
    순위→점수: 1위=10, 2=8, 3=6, 4=4, 5=2, 6+=1
    """
    rank_to_pts = {1: 10, 2: 8, 3: 6, 4: 4, 5: 2}
    weights = [0.5, 0.3, 0.2]
    ranks = recent_ranks[:3]  # 최근 3경기
    if not ranks:
        return 50.0  # 데이터 없으면 중립

    total = 0
    sum_w = 0
    for i, r in enumerate(ranks):
        pts = rank_to_pts.get(int(r), 1)
        w = weights[i] if i < len(weights) else 0.1
        total += pts * w * 10  # 0~100 스케일
        sum_w += w
    return round(min(100, max(0, total / sum_w)), 2)


def _rating_score(rating, max_rating: float) -> float:
    """레이팅 기반 점수 (0~100)."""
    r = float(rating or 0)
    if max_rating and max_rating > 0:
        return round((r / max_rating) * 100, 2)
    return 50.0 if r else 0


def _experience_bonus(total_runs: int, total_wins: int) -> float:
    """경험·실적 보너스. 0~10점."""
    runs = int(total_runs or 0)
    wins = int(total_wins or 0)
    if runs < 10:
        return 0
    win_rate = wins / runs if runs else 0
    exp = min(1, runs / 50) * 5  # 출전 많을수록 +5까지
    perf = win_rate * 5  # 승률 기반 +5까지
    return round(min(10, exp + perf), 2)


def calculate_score(data):
    """
    말 기준 복합 점수 (Speed·Momentum·레이팅).
    Input: { entries: [...] } — entries에 rating, recentRanks, totalRuns, totalWins 등
    Output: [ { hrNo, score, momentumScore, ratingScore, experienceBonus, reason } ]
    """
    try:
        entries = data.get('entries', [])
        if not entries:
            return []

        ratings = []
        for e in entries:
            r = e.get('rating')
            if r is not None:
                try:
                    ratings.append(float(r))
                except (ValueError, TypeError):
                    pass
        max_rating = max(ratings) if ratings else 100

        results = []
        for e in entries:
            hr_no = e.get('hrNo', '')
            rating = e.get('rating')
            recent_ranks = _parse_recent_ranks(e.get('recentRanks') or e.get('recent_ranks'))
            total_runs = e.get('totalRuns') or e.get('rcCntT')
            total_wins = e.get('totalWins') or e.get('ord1CntT')

            rating_score = _rating_score(rating, max_rating)
            momentum = _momentum_score(recent_ranks)
            exp_bonus = _experience_bonus(total_runs, total_wins)

            # 복합: 레이팅 50%, 기세 40%, 경험 10%
            composite = rating_score * 0.5 + momentum * 0.4 + exp_bonus
            composite = round(min(100, max(0, composite)), 2)

            reason_parts = []
            if recent_ranks:
                recent_str = '→'.join(str(r) + '위' for r in recent_ranks[:3])
                reason_parts.append(f'최근순위 {recent_str}')
            if rating is not None:
                reason_parts.append(f'레이팅 {rating}')
            reason = ', '.join(reason_parts) if reason_parts else '데이터 기반'

            results.append({
                'hrNo': hr_no,
                'hrName': e.get('hrName', ''),
                'score': composite,
                'ratingScore': rating_score,
                'momentumScore': momentum,
                'experienceBonus': exp_bonus,
                'recentRanks': recent_ranks[:5],
                'reason': reason,
            })

        return results

    except Exception as e:
        import traceback
        return {'error': str(e), 'traceback': traceback.format_exc()}


if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({'error': 'No input data'}))
        else:
            data = json.loads(input_data)
            command = data.get('command', 'calculate_score')

            if command == 'analyze_jockey':
                result = analyze_jockey(data)
            else:
                result = calculate_score(data)

            print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
