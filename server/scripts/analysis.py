"""
KRA 경마 예측 분석 v2 — 정규화·변수 보강·토큰 최적화
- 모든 하위 점수 0~100 정규화
- 가중치 합 = 1.0 (경마 학술 연구 기반 배분)
- 누락 변수 추가: 컨디션(마체중·연령·부담중량), 거리적합도, 성별
- 낙마 리스크 → 감점 적용 (별도 출력도 유지)
- softmax 승률 확률 산출
- compact tags 출력 (토큰 절감)
"""
import sys
import json
import math

# ─── 말+기수 통합 가중치 (합 = 1.0) ───
# 경마 예측 학술 연구(Racing Post / Timeform) 기반 배분
# jockey: entry.jockeyMeetWinRate / jockeyMeetQuRate 사용 (Python 직접 반영)
W_HORSE = {
    'rating': 0.28,
    'form': 0.24,
    'condition': 0.12,
    'experience': 0.08,
    'suitability': 0.09,
    'trainer': 0.09,
    'jockey': 0.10,
}


def _parse_recent_ranks(val):
    if val is None:
        return []
    if isinstance(val, list):
        return [int(x) for x in val if isinstance(x, (int, float)) and not (isinstance(x, float) and x != int(x))]
    if isinstance(val, str):
        try:
            parsed = json.loads(val)
            return _parse_recent_ranks(parsed)
        except Exception:
            return []
    return []


# ─── Sub-score 함수 (모두 0~100 반환) ───

def _rating_score(rating, max_rating):
    """레이팅 → 0~100. sigmoid 상대비교(55%) + 절대구간(45%)."""
    r = float(rating or 0)
    if r <= 0:
        return 25.0

    if max_rating and max_rating > 0:
        ratio = r / max_rating
        rel = 100 / (1 + math.exp(-12 * (ratio - 0.75)))
    else:
        rel = 50.0

    clamped = max(1, r - 35)
    abs_s = min(100, max(0, 10 + 90 * (math.log(clamped) / math.log(60))))

    return round(rel * 0.55 + abs_s * 0.45, 2)


def _form_score(recent_ranks, rating, rating_history):
    """최근 성적(착순 가중평균) + 기세(추이) + 레이팅 추이 → 0~100."""
    ranks = recent_ranks[:5] if recent_ranks else []
    if not ranks:
        return 45.0

    rank_pts = {1: 100, 2: 85, 3: 72, 4: 60, 5: 50, 6: 40, 7: 32, 8: 25}
    weights = [0.40, 0.25, 0.18, 0.10, 0.07]

    total = 0.0
    w_sum = 0.0
    for i, r in enumerate(ranks):
        w = weights[i] if i < len(weights) else 0.03
        pts = rank_pts.get(int(r), max(10, 30 - int(r) * 2))
        total += pts * w
        w_sum += w

    base = total / w_sum if w_sum > 0 else 45

    trend = 0.0
    if len(ranks) >= 3:
        recent_avg = sum(ranks[:2]) / 2
        prev_slice = ranks[2:min(4, len(ranks))]
        prev_avg = sum(prev_slice) / max(1, len(prev_slice))
        improvement = prev_avg - recent_avg
        trend = min(8, max(-6, improvement * 2.5))

    rating_trend = 0.0
    if isinstance(rating_history, list) and len(rating_history) > 0 and rating:
        try:
            prev_r = float(rating_history[0])
            curr_r = float(rating)
            delta = curr_r - prev_r
            if delta > 3:
                rating_trend = 4.0
            elif delta > 0:
                rating_trend = 1.5
            elif delta < -3:
                rating_trend = -3.0
            elif delta < 0:
                rating_trend = -1.0
        except (ValueError, TypeError):
            pass

    return round(min(100, max(0, base + trend + rating_trend)), 2)


def _condition_score(entry):
    """컨디션 (마체중변화 + 연령 + 부담중량 + 성별) → 0~100."""
    score = 55.0

    hw = str(entry.get("horseWeight") or "")
    if "(" in hw:
        try:
            delta = float(hw.split("(")[1].rstrip(")"))
            abs_d = abs(delta)
            if abs_d <= 2:
                score += 15
            elif abs_d <= 4:
                score += 8
            elif abs_d <= 8:
                score -= 5
            elif abs_d <= 12:
                score -= 12
            else:
                score -= 20
        except (ValueError, IndexError):
            pass

    age = int(entry.get("age") or 0)
    if age == 4:
        score += 12
    elif age == 5:
        score += 10
    elif age == 3:
        score += 5
    elif age == 6:
        score -= 3
    elif age >= 7:
        score -= 8

    wg = float(entry.get("wgBudam") or 55)
    wg_diff = wg - 55.0
    if wg_diff > 0:
        score -= wg_diff * 2.5
    elif wg_diff < -2:
        score += min(8, abs(wg_diff) * 1.5)

    sex = str(entry.get("sex") or "").strip()
    if sex == "거":
        score += 3

    return round(min(100, max(0, score)), 2)


def _experience_score(total_runs, total_wins):
    """경험·실적 → 0~100 (로그 스케일 출전 + 승률 구간)."""
    runs = int(total_runs or 0)
    wins = int(total_wins or 0)
    win_rate = (wins / runs * 100) if runs > 0 else 0

    if runs == 0:
        return 20.0

    run_score = min(50, 10 * math.log(1 + runs / 5))

    if win_rate >= 20:
        wr_score = 50
    elif win_rate >= 15:
        wr_score = 42
    elif win_rate >= 10:
        wr_score = 33
    elif win_rate >= 5:
        wr_score = 22
    elif win_rate >= 2:
        wr_score = 12
    else:
        wr_score = 5

    if runs < 10:
        return round(max(5, (run_score + wr_score) * 0.6), 2)

    return round(min(100, run_score + wr_score), 2)


def _trainer_score(entry):
    """조교사 능력 → 0~100."""
    win_rate = entry.get("trainerWinRate")
    qu_rate = entry.get("trainerQuRate")

    if win_rate is None and qu_rate is None:
        return 40.0

    score = 30.0
    try:
        if win_rate is not None:
            score += min(35, float(win_rate) * 2.0)
        if qu_rate is not None:
            score += min(25, float(qu_rate) * 0.7)
    except (ValueError, TypeError):
        pass

    return round(min(100, max(0, score)), 2)


def _jockey_score(entry):
    """기수 능력 → 0~100.
    Primary: meet-level win/place rate (jockeyMeetWinRate/jockeyMeetQuRate).
    Fallback: career-wide aggregated rate across all meets (jockeyFallbackCareer=True).
              Less predictive than meet-specific, so a 10% discount is applied.
    Default: 40.0 when no DB data exists.
    """
    win_rate = entry.get("jockeyMeetWinRate")
    qu_rate = entry.get("jockeyMeetQuRate")
    rc_cnt = int(entry.get("jockeyRcCntT") or 0)
    is_career_fallback = bool(entry.get("jockeyFallbackCareer"))

    if win_rate is None and qu_rate is None:
        return 40.0

    score = 20.0
    try:
        if win_rate is not None:
            score += min(45, float(win_rate) * 2.5)
        if qu_rate is not None:
            score += min(25, float(qu_rate) * 0.7)
    except (ValueError, TypeError):
        pass

    # Rookie penalty: fewer than 100 career races
    if rc_cnt > 0 and rc_cnt < 100:
        score *= 0.85

    # Career-wide fallback is less predictive than meet-specific data
    if is_career_fallback:
        score *= 0.90

    return round(min(100, max(0, score)), 2)


def _suitability_score(entry, rc_dist, track):
    """거리·각질·주로 적합도 → 0~100."""
    score = 50.0
    tag = str(entry.get("sectionalTag") or "").lower()

    if "선행" in tag:
        if rc_dist <= 1200:
            score += 20
        elif rc_dist <= 1400:
            score += 12
        elif rc_dist <= 1600:
            score += 3
        elif rc_dist <= 1800:
            score -= 5
        else:
            score -= 10
    elif "추입" in tag:
        if rc_dist >= 1800:
            score += 18
        elif rc_dist >= 1600:
            score += 10
        elif rc_dist >= 1400:
            score += 3
        elif rc_dist >= 1200:
            score -= 5
        else:
            score -= 12
    elif "중간" in tag:
        score += 5

    track_lower = str(track or "").lower()
    if any(x in track_lower for x in ("습", "불", "중")):
        if "선행" in tag:
            score -= 8
        elif "추입" in tag:
            score += 5

    return round(min(100, max(0, score)), 2)


def _fall_risk_score(entry, jockey_rc_cnt=0):
    """낙마 리스크 (0~100)."""
    risk = 0.0
    h_fall = int(entry.get("fallHistoryHorse") or 0)
    if h_fall >= 2:
        risk += 35
    elif h_fall >= 1:
        risk += 20
    j_fall = int(entry.get("fallHistoryJockey") or 0)
    if j_fall >= 2:
        risk += 25
    elif j_fall >= 1:
        risk += 15
    rc_cnt = jockey_rc_cnt or int(entry.get("rcCntT") or 0)
    if rc_cnt < 100:
        risk += 10
    equip = str(entry.get("equipment") or "").lower()
    if any(x in equip for x in ("가면", "눈가리개", "망사눈", "혀끈")):
        risk += 8
    bled = entry.get("bleedingInfo")
    if bled and (isinstance(bled, dict) or (isinstance(bled, list) and len(bled) > 0)):
        risk += 12
    return round(min(100, risk), 2)


def _cascade_fall_risk(entries):
    """연쇄 낙마 리스크 (0~100)."""
    if not entries:
        return 0.0
    leading = [e for e in entries if "선행" in str(e.get("sectionalTag") or "")]
    closing = [e for e in entries if "추입" in str(e.get("sectionalTag") or "")]
    for e in entries:
        if e in leading or e in closing:
            continue
        ranks = e.get("recentRanks")
        if isinstance(ranks, list) and len(ranks) > 0:
            valid = [int(x) for x in ranks[:3] if isinstance(x, (int, float))]
            if valid:
                avg_r = sum(valid) / len(valid)
                if avg_r <= 4:
                    leading.append(e)
                elif avg_r >= 6:
                    closing.append(e)
    leading_risks = [_fall_risk_score(e) for e in leading]
    max_leading = max(leading_risks) if leading_risks else 0
    closer_ratio = len(closing) / len(entries) if entries else 0
    cascade = 0.0
    if max_leading >= 50:
        cascade = 30 + closer_ratio * 40
    elif max_leading >= 30:
        cascade = 15 + closer_ratio * 25
    elif max_leading >= 20 and closer_ratio >= 0.3:
        cascade = 10
    return round(min(100, cascade), 2)


def _win_probability(scores):
    """softmax → 승률 확률(%). T=12 (충분한 분산, 상위마 차별화)."""
    if not scores:
        return []
    T = 12.0
    max_s = max(scores)
    exp_s = [math.exp((s - max_s) / T) for s in scores]
    total = sum(exp_s)
    if total == 0:
        n = len(scores)
        return [round(100 / n, 1)] * n
    return [round(e / total * 100, 1) for e in exp_s]


def _build_tags(entry, rating, recent_ranks, total_runs, total_wins,
                form_val, cnd_val, fall_risk):
    """Gemini 전달용 compact 태그 배열."""
    tags = []
    r = float(rating or 0)
    if r >= 80:
        tags.append(f"R상위{r:.0f}")
    elif r >= 70:
        tags.append(f"R중상{r:.0f}")
    elif r >= 60:
        tags.append(f"R중위{r:.0f}")
    elif r > 0:
        tags.append(f"R하위{r:.0f}")

    if len(recent_ranks) >= 2:
        if recent_ranks[0] < recent_ranks[1]:
            tags.append("기세↑")
        elif recent_ranks[0] > recent_ranks[1]:
            tags.append("기세↓")

    runs = int(total_runs or 0)
    wins = int(total_wins or 0)
    if runs >= 50 and runs > 0 and wins / runs >= 0.15:
        tags.append(f"베테랑{runs}전{wins}승")
    elif runs < 10:
        tags.append("신인")

    if cnd_val >= 75:
        tags.append("컨디션◎")
    elif cnd_val <= 35:
        tags.append("컨디션△")

    if fall_risk >= 30:
        tags.append(f"낙마위험{fall_risk:.0f}")

    return tags


def _build_reason(tags, recent_ranks):
    """DB 저장용 reason 문자열 (tags + 최근 착순)."""
    parts = list(tags)
    if recent_ranks:
        recent_str = '→'.join(str(r) + '위' for r in recent_ranks[:5])
        parts.insert(1, f'최근{recent_str}')
    return ', '.join(parts) if parts else '데이터기반'


# ─── 메인 점수 산출 ───

def calculate_score(data):
    """
    통합 점수 산출 v2.
    - 모든 sub-score 0~100 정규화
    - 가중 합산 (W_HORSE, 합=1.0)
    - 낙마 리스크 감점
    - softmax 승률 확률
    """
    entries = data.get('entries') or data.get('entryDetails') or []
    if not entries:
        return {'scores': [], 'cascadeFallRisk': 0}

    try:
        race = data.get('race') or {}
        rc_dist = int(race.get('rcDist') or 0)
        track = str(race.get('track') or "")

        ratings = []
        for e in entries:
            rv = e.get('rating')
            if rv is not None:
                try:
                    ratings.append(float(rv))
                except (ValueError, TypeError):
                    pass
        max_rating = max(ratings) if ratings else 80

        results = []
        composite_list = []

        for e in entries:
            hr_no = e.get('hrNo') or e.get('chulNo') or ''
            if not hr_no:
                continue
            chul_no = e.get('chulNo') or (str(hr_no) if len(str(hr_no)) <= 2 else None)
            rating = e.get('rating')
            recent_ranks = _parse_recent_ranks(e.get('recentRanks') or e.get('recent_ranks'))
            total_runs = e.get('totalRuns') or e.get('rcCntT')
            total_wins = e.get('totalWins') or e.get('ord1CntT')
            rating_history = e.get('ratingHistory')

            rat = _rating_score(rating, max_rating)
            frm = _form_score(recent_ranks, rating, rating_history)
            cnd = _condition_score(e)
            exp = _experience_score(total_runs, total_wins)
            trn = _trainer_score(e)
            suit = _suitability_score(e, rc_dist, track)
            jky = _jockey_score(e)

            composite = (
                rat * W_HORSE['rating']
                + frm * W_HORSE['form']
                + cnd * W_HORSE['condition']
                + exp * W_HORSE['experience']
                + trn * W_HORSE['trainer']
                + suit * W_HORSE['suitability']
                + jky * W_HORSE['jockey']
            )

            fall_risk = _fall_risk_score(e)
            if fall_risk >= 50:
                composite *= 0.88
            elif fall_risk >= 30:
                composite *= 0.94
            elif fall_risk >= 20:
                composite *= 0.97

            chaksun1 = e.get('chaksun1')
            if chaksun1:
                try:
                    v = float(chaksun1)
                    if v > 0:
                        composite += min(3, v / 15000)
                except (ValueError, TypeError):
                    pass

            composite = round(min(100, max(0, composite)), 2)
            composite_list.append(composite)

            tags = _build_tags(e, rating, recent_ranks, total_runs, total_wins,
                               frm, cnd, fall_risk)

            results.append({
                'hrNo': str(hr_no),
                'chulNo': str(chul_no) if chul_no else None,
                'hrName': e.get('hrName', ''),
                'score': composite,
                'sub': {
                    'rat': rat, 'frm': frm, 'cnd': cnd,
                    'exp': exp, 'trn': trn, 'suit': suit, 'jky': jky,
                },
                'risk': fall_risk,
                'recentRanks': recent_ranks[:5],
                'tags': tags,
                'reason': _build_reason(tags, recent_ranks),
            })

        if composite_list:
            probs = _win_probability(composite_list)
            for i, r in enumerate(results):
                if i < len(probs):
                    r['winProb'] = probs[i]

        cascade = _cascade_fall_risk(entries) if results else 0.0
        return {'scores': results, 'cascadeFallRisk': cascade}

    except Exception:
        import traceback
        traceback.print_exc()
        return {'scores': _minimal_fallback(entries), 'cascadeFallRisk': 0}


# ─── 기수 분석 (기존 유지 + 경미한 개선) ───

def calculate_jockey_score(jockey: dict) -> float:
    """기수 점수 (0~100). 승률/복승률 80점 + 경험 20점."""
    win_rate = float(jockey.get("winRateTsum", 0) or 0)
    qu_rate = float(jockey.get("quRateTsum", 0) or 0)
    rc_cnt = int(jockey.get("rcCntT", 0) or 0)

    if rc_cnt >= 1000:
        exp_score = 1.0
    elif rc_cnt >= 100:
        exp_score = 0.5 + (rc_cnt - 100) / 1800
    else:
        exp_score = 0.3 + rc_cnt / 200

    if rc_cnt < 100:
        exp_score *= 0.85

    perf_part = min(80, win_rate * 0.5 + qu_rate * 0.5)
    exp_part = exp_score * 20
    score = perf_part + exp_part
    return round(min(100, max(0, score)), 2)


def get_weight_ratio(race: dict, entries: list, results: list = None) -> tuple:
    """말 vs 기수 가중치. 혼전 50/50, 특수 60/40, 일반 70/30."""
    weather = str(race.get("weather") or "").strip().lower()
    track = str(race.get("track") or "").strip().lower()
    rc_dist = int(race.get("rcDist") or 0)

    def parse_time(val):
        if val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    is_close = False
    if results and len(results) > 0:
        times = [parse_time(r.get("rcTime")) for r in results[:5]]
        times = [t for t in times if t is not None]
        is_close = len(times) >= 2 and (max(times) - min(times)) <= 0.5
    else:
        r_vals = [float(r.get("rating") or 0) for r in entries[:8] if r.get("rating")]
        r_vals = [r for r in r_vals if r > 0]
        if len(r_vals) >= 3:
            top = sorted(r_vals, reverse=True)[:5]
            is_close = max(top) - min(top) <= 10

    bad_track = any(x in track for x in ("습", "추", "불", "중"))
    is_special = weather not in ("맑음", "맑", "") or bad_track or rc_dist >= 1800

    if is_close:
        return 0.5, 0.5
    if is_special:
        return 0.6, 0.4
    return 0.7, 0.3


def analyze_jockey(data: dict) -> dict:
    """2단계 필터링 통합 분석."""
    race = data.get("race", {})
    entries = data.get("entries", [])
    jockey_map = data.get("jockeyMap", {})
    results = data.get("results", [])

    meet = str(race.get("meet", "1"))
    if meet in ("서울", "Seoul"):
        meet = "1"
    elif meet in ("제주", "Jeju"):
        meet = "2"
    elif meet in ("부산", "부경", "Busan"):
        meet = "3"

    horse_weight, jockey_weight = get_weight_ratio(race, entries, results)

    def _rating_to_score(r):
        if r is None or r <= 0:
            return 50.0
        v = float(r)
        return min(100, max(0, (v - 45) / 45 * 100))

    entries_with_scores = []
    for e in entries:
        jk_no = e.get("jkNo") or ""
        key = f"{meet}_{jk_no}"
        jockey = jockey_map.get(key)

        jockey_score = 0.0
        if jockey:
            jockey_score = calculate_jockey_score(jockey)

        rating = e.get("rating")
        horse_score = _rating_to_score(rating)

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


# ─── Fallback ───

def _minimal_fallback(entries: list) -> list:
    out = []
    for i, e in enumerate(entries[:14]):
        hr_no = e.get('hrNo') or e.get('chulNo') or str(i + 1)
        chul_no = e.get('chulNo') or (hr_no if len(str(hr_no)) <= 2 else '')
        out.append({
            'hrNo': str(hr_no),
            'chulNo': str(chul_no) if chul_no else None,
            'hrName': e.get('hrName', ''),
            'score': 50.0 + (14 - i) * 2,
            'reason': '데이터보강',
        })
    return out


# ─── Entry point ───

if __name__ == "__main__":
    data = {}
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps([]))
        else:
            data = json.loads(input_data)
            command = data.get('command', 'calculate_score')

            if command == 'analyze_jockey':
                result = analyze_jockey(data)
            else:
                result = calculate_score(data)
                if isinstance(result, dict):
                    pass
                elif not isinstance(result, list):
                    result = _minimal_fallback(data.get('entries', []))

            print(json.dumps(result))
    except Exception:
        import traceback
        traceback.print_exc()
        try:
            print(json.dumps(_minimal_fallback(data.get('entries', []))))
        except Exception:
            print(json.dumps([]))
