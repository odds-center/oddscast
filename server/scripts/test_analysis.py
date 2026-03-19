"""
Unit tests for analysis.py scoring functions.
Run: cd server/scripts && python -m pytest test_analysis.py -v
"""
import math
import pytest
from analysis import (
    _rating_score,
    _form_score,
    _condition_score,
    _experience_score,
    _trainer_score,
    _jockey_score,
    _suitability_score,
    _rest_period_score,
    _distance_score,
    _class_change_score,
    _training_readiness_score,
    _same_day_fatigue_score,
    _gate_bias_score,
    _field_size_score,
    _pace_scenario_score,
    _fall_risk_score,
    _cascade_fall_risk,
    _win_probability,
    _parse_recent_ranks,
    calculate_score,
    calculate_jockey_score,
    get_weight_ratio,
    W_HORSE,
)


# ─── Weight validation ───

class TestWeights:
    def test_weights_sum_to_one(self):
        assert abs(sum(W_HORSE.values()) - 1.0) < 1e-9

    def test_all_fifteen_factors(self):
        expected = {
            'rating', 'form', 'condition', 'experience', 'suitability',
            'trainer', 'jockey', 'rest', 'distance', 'class_change',
            'training_readiness', 'same_day_fatigue',
            'gate_bias', 'field_size', 'pace_scenario',
        }
        assert set(W_HORSE.keys()) == expected

    def test_all_weights_positive(self):
        for k, v in W_HORSE.items():
            assert v > 0, f"{k} weight must be positive"


# ─── _rating_score ───

class TestRatingScore:
    def test_zero_rating(self):
        assert _rating_score(0, 80) == 25.0

    def test_none_rating(self):
        assert _rating_score(None, 80) == 25.0

    def test_negative_rating(self):
        assert _rating_score(-5, 80) == 25.0

    def test_max_rating_is_self(self):
        # ratio = 1.0, sigmoid near max
        score = _rating_score(80, 80)
        assert 70 < score <= 100

    def test_low_rating_vs_high_max(self):
        # ratio=0.3 → sigmoid very low (~0), absolute part dominates
        score = _rating_score(30, 100)
        assert 0 < score < 30

    def test_no_max_rating(self):
        score = _rating_score(70, 0)
        # relative part defaults to 50
        assert 40 < score < 80

    def test_output_range(self):
        for r in [1, 10, 30, 50, 70, 90, 100]:
            s = _rating_score(r, 100)
            assert 0 <= s <= 100


# ─── _form_score ───

class TestFormScore:
    def test_no_ranks(self):
        assert _form_score([], 50, None) == 45.0

    def test_single_first_place(self):
        score = _form_score([1], 50, None)
        assert score >= 80  # weighted 100 * 0.4 / 0.4 = 100

    def test_improving_trend(self):
        # recent [1,2] vs prev [5,6] -> improvement
        score_improving = _form_score([1, 2, 5, 6], 50, None)
        score_declining = _form_score([5, 6, 1, 2], 50, None)
        assert score_improving > score_declining

    def test_rating_trend_positive(self):
        base = _form_score([3, 3, 3], 60, None)
        boosted = _form_score([3, 3, 3], 60, [55])  # delta = +5 > 3
        assert boosted > base

    def test_rating_trend_negative(self):
        base = _form_score([3, 3, 3], 50, None)
        penalized = _form_score([3, 3, 3], 50, [55])  # delta = -5 < -3
        assert penalized < base

    def test_output_clamped(self):
        s = _form_score([1, 1, 1, 1, 1], 100, [50])
        assert 0 <= s <= 100


# ─── _condition_score ───

class TestConditionScore:
    def test_optimal_condition(self):
        entry = {"horseWeight": "450(+1)", "age": 4, "wgBudam": 55, "sex": "거"}
        score = _condition_score(entry)
        assert score >= 75  # +15 weight + 12 age + 3 gelding

    def test_bad_weight_change(self):
        entry = {"horseWeight": "450(+15)", "age": 5, "wgBudam": 55}
        score = _condition_score(entry)
        assert score < 55  # -20 from weight change

    def test_heavy_burden_weight(self):
        entry = {"horseWeight": "450(0)", "age": 4, "wgBudam": 60}
        score = _condition_score(entry)
        # +12 age, -12.5 burden (5*2.5)
        light = _condition_score({"horseWeight": "450(0)", "age": 4, "wgBudam": 53})
        assert score < light

    def test_old_horse(self):
        old = _condition_score({"age": 8, "wgBudam": 55})
        young = _condition_score({"age": 4, "wgBudam": 55})
        assert old < young

    def test_no_data(self):
        score = _condition_score({})
        assert score == 55.0  # base only


# ─── _experience_score ───

class TestExperienceScore:
    def test_zero_runs(self):
        assert _experience_score(0, 0) == 20.0

    def test_novice_penalty(self):
        score = _experience_score(5, 1)
        assert score < 40  # < 10 runs → 60% penalty

    def test_experienced_winner(self):
        score = _experience_score(100, 25)
        assert score > 60

    def test_many_runs_no_wins(self):
        score = _experience_score(50, 0)
        # Good run_score but win_rate bracket = 5
        assert 20 < score < 50


# ─── _trainer_score ───

class TestTrainerScore:
    def test_no_data(self):
        assert _trainer_score({}) == 35.0  # No data = slight disadvantage

    def test_good_trainer(self):
        score = _trainer_score({"trainerWinRate": 15, "trainerQuRate": 40})
        assert score > 60

    def test_bad_trainer(self):
        score = _trainer_score({"trainerWinRate": 1, "trainerQuRate": 5})
        assert score < 45


# ─── _jockey_score ───

class TestJockeyScore:
    def test_no_data(self):
        assert _jockey_score({}) == 35.0  # No data = slight disadvantage

    def test_good_jockey(self):
        score = _jockey_score({"jockeyMeetWinRate": 15, "jockeyMeetQuRate": 40, "jockeyRcCntT": 500})
        assert score > 60

    def test_rookie_penalty(self):
        base = _jockey_score({"jockeyMeetWinRate": 10, "jockeyMeetQuRate": 30, "jockeyRcCntT": 500})
        rookie = _jockey_score({"jockeyMeetWinRate": 10, "jockeyMeetQuRate": 30, "jockeyRcCntT": 50})
        assert rookie < base  # 0.85 multiplier

    def test_career_fallback_discount(self):
        meet = _jockey_score({"jockeyMeetWinRate": 10, "jockeyMeetQuRate": 30, "jockeyRcCntT": 500})
        fallback = _jockey_score({"jockeyMeetWinRate": 10, "jockeyMeetQuRate": 30, "jockeyRcCntT": 500, "jockeyFallbackCareer": True})
        assert fallback < meet  # 0.90 multiplier


# ─── _suitability_score ───

class TestSuitabilityScore:
    def test_front_runner_short_distance(self):
        score = _suitability_score({"sectionalTag": "선행마"}, 1200, "양")
        assert score >= 70  # +20

    def test_front_runner_long_distance(self):
        score = _suitability_score({"sectionalTag": "선행마"}, 2000, "양")
        assert score <= 45  # -10

    def test_closer_long_distance(self):
        score = _suitability_score({"sectionalTag": "추입마"}, 1800, "양")
        assert score >= 65  # +18

    def test_wet_track_penalty_front_runner(self):
        dry = _suitability_score({"sectionalTag": "선행마"}, 1400, "양")
        wet = _suitability_score({"sectionalTag": "선행마"}, 1400, "습")
        assert wet < dry  # -8 penalty

    def test_no_tag(self):
        score = _suitability_score({}, 1400, "양")
        assert score == 50.0


# ─── _rest_period_score ───

class TestRestPeriodScore:
    def test_optimal_rest(self):
        assert _rest_period_score({"daysSinceLastRace": 30}) == 75.0

    def test_no_data(self):
        assert _rest_period_score({}) == 50.0

    def test_too_short(self):
        assert _rest_period_score({"daysSinceLastRace": 5}) == 25.0

    def test_too_long(self):
        assert _rest_period_score({"daysSinceLastRace": 100}) == 20.0

    def test_slightly_short(self):
        assert _rest_period_score({"daysSinceLastRace": 10}) == 35.0

    def test_all_tiers(self):
        tiers = {5: 25, 10: 35, 18: 60, 30: 75, 50: 60, 80: 40, 120: 20}
        for days, expected in tiers.items():
            assert _rest_period_score({"daysSinceLastRace": days}) == expected


# ─── _distance_score ───

class TestDistanceScore:
    def test_no_data(self):
        assert _distance_score({}) == 50.0

    def test_high_win_rate(self):
        score = _distance_score({"distWinRate": 25, "distPlaceRate": 60, "distRaceCount": 10})
        assert score > 70

    def test_low_confidence_regression(self):
        high_conf = _distance_score({"distWinRate": 20, "distPlaceRate": 50, "distRaceCount": 10})
        low_conf = _distance_score({"distWinRate": 20, "distPlaceRate": 50, "distRaceCount": 2})
        assert low_conf < high_conf  # regressed toward 50


# ─── _class_change_score ───

class TestClassChangeScore:
    def test_no_change(self):
        assert _class_change_score({}) == 50.0
        assert _class_change_score({"classChange": "same"}) == 50.0

    def test_drop_one_level(self):
        assert _class_change_score({"classChange": "down", "classChangeLevel": 1}) == 65.0

    def test_drop_two_levels(self):
        assert _class_change_score({"classChange": "down", "classChangeLevel": 2}) == 75.0

    def test_up_one_level(self):
        assert _class_change_score({"classChange": "up", "classChangeLevel": 1}) == 35.0

    def test_up_two_levels(self):
        assert _class_change_score({"classChange": "up", "classChangeLevel": 2}) == 25.0


# ─── _training_readiness_score ───

class TestTrainingReadinessScore:
    def test_no_data(self):
        assert _training_readiness_score({}) == 50.0

    def test_optimal_training(self):
        entry = {"trainingMetrics": {
            "sessionCount": 5, "highIntensityCount": 2,
            "daysSinceLastTraining": 3, "avgSessionsPerWeek": 2.5,
        }}
        score = _training_readiness_score(entry)
        # 45 + 15 (sessions) + 12 (intensity 0.4) + 10 (taper) = 82
        assert score >= 75

    def test_no_sessions(self):
        entry = {"trainingMetrics": {"sessionCount": 0}}
        score = _training_readiness_score(entry)
        assert score == 45.0  # base only

    def test_stale_training(self):
        entry = {"trainingMetrics": {
            "sessionCount": 4, "highIntensityCount": 1,
            "daysSinceLastTraining": 12,
        }}
        score = _training_readiness_score(entry)
        # 45 + 15 - 5 (stale) + intensity bonus
        assert score < 70


# ─── _same_day_fatigue_score ───

class TestSameDayFatigueScore:
    def test_no_prior_races(self):
        assert _same_day_fatigue_score({}) == 50.0
        assert _same_day_fatigue_score({"sameDayRacesBefore": 0}) == 50.0

    def test_second_race_with_gap(self):
        score = _same_day_fatigue_score({"sameDayRacesBefore": 1, "hoursSinceLastSameDayRace": 5})
        assert score == 42.0  # 30 + 12

    def test_third_race_no_gap(self):
        score = _same_day_fatigue_score({"sameDayRacesBefore": 2, "hoursSinceLastSameDayRace": 1})
        assert score == 20.0  # base only, no bonus

    def test_fourth_race(self):
        score = _same_day_fatigue_score({"sameDayRacesBefore": 3})
        assert score == 10.0


# ─── _gate_bias_score ───

class TestGateBiasScore:
    def test_no_gate(self):
        assert _gate_bias_score(None, '서울', 1400, 10) == 50.0

    def test_inner_gate_busan(self):
        score = _gate_bias_score(1, '부산경남', 1200, 10)
        assert score >= 65  # strong inner bias

    def test_inner_gate_jeju(self):
        score = _gate_bias_score(2, '제주', 1200, 8)
        assert score >= 65

    def test_inner_gate_seoul_sprint(self):
        score = _gate_bias_score(1, '서울', 1200, 12)
        assert score >= 60

    def test_inner_gate_seoul_long(self):
        score = _gate_bias_score(2, '서울', 1800, 10)
        assert 50 < score < 65  # mild advantage

    def test_outer_gate_penalty(self):
        inner = _gate_bias_score(1, '부산경남', 1200, 12)
        outer = _gate_bias_score(12, '부산경남', 1200, 12)
        assert inner > outer

    def test_very_outer_gate(self):
        score = _gate_bias_score(14, '서울', 1400, 14)
        assert score < 40

    def test_mid_gate_neutral(self):
        score = _gate_bias_score(5, '서울', 1600, 10)
        assert 48 <= score <= 58


# ─── _field_size_score ───

class TestFieldSizeScore:
    def test_no_field_size(self):
        assert _field_size_score({}, 0, 80) == 50.0

    def test_small_field_top_rated(self):
        entry = {"rating": 80, "recentRanks": [1, 2]}
        score = _field_size_score(entry, 6, 85)
        assert score > 60  # top-rated in small field

    def test_small_field_low_rated(self):
        entry = {"rating": 40, "recentRanks": [7, 8]}
        score = _field_size_score(entry, 6, 85)
        assert score <= 55

    def test_large_field_front_runner(self):
        entry = {"recentRanks": [5, 6], "sectionalTag": "선행마"}
        score = _field_size_score(entry, 14, 80)
        assert score < 45  # front-runners suffer in crowded fields

    def test_large_field_proven_winner(self):
        entry = {"recentRanks": [1, 1, 2]}
        score = _field_size_score(entry, 14, 80)
        assert score > 45  # proven winners cope


# ─── _pace_scenario_score ───

class TestPaceScenarioScore:
    def test_empty_entries(self):
        assert _pace_scenario_score({}, [], 1400) == 50.0

    def test_front_runner_alone(self):
        entries = [
            {"sectionalTag": "선행마"},
            {"sectionalTag": "추입마"},
            {"sectionalTag": "추입마"},
            {"sectionalTag": "중간주행"},
        ]
        score = _pace_scenario_score(entries[0], entries, 1400)
        assert score >= 60  # can control pace

    def test_front_runner_crowded(self):
        entries = [
            {"sectionalTag": "선행마"},
            {"sectionalTag": "선행마"},
            {"sectionalTag": "선행마"},
            {"sectionalTag": "선행마"},
            {"sectionalTag": "추입마"},
        ]
        score = _pace_scenario_score(entries[0], entries, 1600)
        assert score < 40  # overpace + long distance

    def test_closer_benefits_from_overpace(self):
        entries = [
            {"sectionalTag": "선행마"},
            {"sectionalTag": "선행마"},
            {"sectionalTag": "선행마"},
            {"sectionalTag": "선행마"},
            {"sectionalTag": "추입마"},
        ]
        score = _pace_scenario_score(entries[4], entries, 1600)
        assert score >= 60  # closers love overpace

    def test_closer_slow_pace(self):
        entries = [
            {"sectionalTag": "추입마"},
            {"sectionalTag": "추입마"},
            {"sectionalTag": "중간주행"},
        ]
        score = _pace_scenario_score(entries[0], entries, 1400)
        assert score < 45  # no pace to close into


# ─── _fall_risk_score ───

class TestFallRiskScore:
    def test_no_risk(self):
        # rcCntT=0 → rookie risk +10
        assert _fall_risk_score({}) == 10.0

    def test_horse_fall_history(self):
        score = _fall_risk_score({"fallHistoryHorse": 2})
        assert score >= 35

    def test_equipment_risk(self):
        score = _fall_risk_score({"equipment": "눈가리개"})
        assert score >= 8

    def test_bleeding_risk(self):
        score = _fall_risk_score({"bleedingInfo": [{"date": "20260101"}]})
        assert score >= 12

    def test_combined_high_risk(self):
        score = _fall_risk_score({
            "fallHistoryHorse": 2, "fallHistoryJockey": 2,
            "equipment": "가면", "bleedingInfo": [{}],
        })
        assert score >= 80  # 35 + 25 + 8 + 12 = 80

    def test_capped_at_100(self):
        score = _fall_risk_score({
            "fallHistoryHorse": 2, "fallHistoryJockey": 2,
            "rcCntT": 50, "equipment": "가면 눈가리개 혀끈", "bleedingInfo": [{}],
        })
        assert score <= 100


# ─── _cascade_fall_risk ───

class TestCascadeFallRisk:
    def test_empty_entries(self):
        assert _cascade_fall_risk([]) == 0.0

    def test_no_risk_entries(self):
        entries = [{"sectionalTag": "중간주행"} for _ in range(6)]
        assert _cascade_fall_risk(entries) < 15

    def test_high_leading_risk(self):
        entries = [
            {"sectionalTag": "선행마", "fallHistoryHorse": 3, "fallHistoryJockey": 2},
            {"sectionalTag": "추입마"},
            {"sectionalTag": "추입마"},
        ]
        risk = _cascade_fall_risk(entries)
        assert risk > 30  # high leading risk + closer ratio


# ─── _win_probability ───

class TestWinProbability:
    def test_equal_scores(self):
        probs = _win_probability([50, 50, 50])
        assert len(probs) == 3
        for p in probs:
            assert abs(p - 33.3) < 1.0

    def test_dominant_horse(self):
        probs = _win_probability([90, 50, 50])
        assert probs[0] > probs[1]
        assert probs[0] > 40

    def test_sum_to_100(self):
        probs = _win_probability([80, 70, 65, 55, 45])
        assert abs(sum(probs) - 100) < 1.0

    def test_empty(self):
        assert _win_probability([]) == []


# ─── _parse_recent_ranks ───

class TestParseRecentRanks:
    def test_list_input(self):
        assert _parse_recent_ranks([1, 3, 5]) == [1, 3, 5]

    def test_string_json(self):
        assert _parse_recent_ranks("[1, 2, 3]") == [1, 2, 3]

    def test_none(self):
        assert _parse_recent_ranks(None) == []

    def test_mixed_types(self):
        assert _parse_recent_ranks([1, 2.0, "bad", 4]) == [1, 2, 4]


# ─── calculate_score (integration) ───

class TestCalculateScore:
    def _make_entry(self, **kwargs):
        base = {
            "hrNo": "101", "hrName": "TestHorse", "chulNo": "1",
            "rating": 70, "age": 4, "sex": "수", "wgBudam": 55,
            "horseWeight": "460(+2)", "rcCntT": 30, "ord1CntT": 5,
            "recentRanks": [2, 3, 4], "sectionalTag": "중간주행",
            "trainerWinRate": 10, "trainerQuRate": 30,
            "jockeyMeetWinRate": 12, "jockeyMeetQuRate": 35, "jockeyRcCntT": 200,
            "daysSinceLastRace": 28, "distWinRate": 15, "distPlaceRate": 40,
            "distRaceCount": 8, "classChange": "same",
            "trainingMetrics": {"sessionCount": 4, "highIntensityCount": 1, "daysSinceLastTraining": 3},
        }
        base.update(kwargs)
        return base

    def test_basic_output_structure(self):
        data = {"race": {"rcDist": 1400, "track": "양"}, "entries": [self._make_entry()]}
        result = calculate_score(data)
        assert "scores" in result
        assert "cascadeFallRisk" in result
        assert len(result["scores"]) == 1
        horse = result["scores"][0]
        assert "hrNo" in horse
        assert "score" in horse
        assert "sub" in horse
        assert "risk" in horse
        assert "winProb" in horse
        assert "tags" in horse
        assert len(horse["sub"]) == 15

    def test_all_sub_scores_in_range(self):
        data = {"race": {"rcDist": 1400, "track": "양"}, "entries": [self._make_entry()]}
        result = calculate_score(data)
        sub = result["scores"][0]["sub"]
        for key, val in sub.items():
            assert 0 <= val <= 100, f"sub[{key}]={val} out of range"

    def test_composite_in_range(self):
        data = {"race": {"rcDist": 1400, "track": "양"}, "entries": [self._make_entry()]}
        result = calculate_score(data)
        assert 0 <= result["scores"][0]["score"] <= 100

    def test_multiple_entries_win_prob_sum(self):
        entries = [
            self._make_entry(hrNo="101", rating=80),
            self._make_entry(hrNo="102", rating=60),
            self._make_entry(hrNo="103", rating=40),
        ]
        data = {"race": {"rcDist": 1400, "track": "양"}, "entries": entries}
        result = calculate_score(data)
        probs = [s["winProb"] for s in result["scores"]]
        assert abs(sum(probs) - 100) < 2.0

    def test_higher_rating_gets_higher_score(self):
        entries = [
            self._make_entry(hrNo="101", rating=90),
            self._make_entry(hrNo="102", rating=40),
        ]
        data = {"race": {"rcDist": 1400, "track": "양"}, "entries": entries}
        result = calculate_score(data)
        scores_map = {s["hrNo"]: s["score"] for s in result["scores"]}
        assert scores_map["101"] > scores_map["102"]

    def test_empty_entries(self):
        result = calculate_score({"entries": []})
        assert result == {"scores": [], "cascadeFallRisk": 0}

    def test_fall_risk_deduction(self):
        safe = self._make_entry(hrNo="101", fallHistoryHorse=0, fallHistoryJockey=0)
        risky = self._make_entry(hrNo="102", fallHistoryHorse=3, fallHistoryJockey=2)
        data = {"race": {"rcDist": 1400, "track": "양"}, "entries": [safe, risky]}
        result = calculate_score(data)
        scores_map = {s["hrNo"]: s for s in result["scores"]}
        # Risky horse should have lower score due to fall risk deduction
        assert scores_map["102"]["risk"] > 50
        # Score gap should exist even with same base stats
        assert scores_map["101"]["score"] > scores_map["102"]["score"]


# ─── calculate_jockey_score ───

class TestCalculateJockeyScore:
    def test_experienced_jockey(self):
        score = calculate_jockey_score({"winRateTsum": 15, "quRateTsum": 40, "rcCntT": 1000})
        assert score > 40

    def test_rookie_jockey(self):
        score = calculate_jockey_score({"winRateTsum": 5, "quRateTsum": 15, "rcCntT": 50})
        rookie_penalty = score
        no_penalty = calculate_jockey_score({"winRateTsum": 5, "quRateTsum": 15, "rcCntT": 200})
        assert rookie_penalty < no_penalty

    def test_zero_stats(self):
        score = calculate_jockey_score({})
        assert 0 <= score <= 100


# ─── get_weight_ratio ───

class TestGetWeightRatio:
    def test_normal_conditions(self):
        horse_w, jockey_w = get_weight_ratio({"rcDist": 1400, "weather": "맑음", "track": "양"}, [])
        assert horse_w == 0.7
        assert jockey_w == 0.3

    def test_wet_track(self):
        horse_w, jockey_w = get_weight_ratio({"rcDist": 1400, "weather": "비", "track": "불"}, [])
        assert horse_w == 0.6
        assert jockey_w == 0.4

    def test_long_distance(self):
        horse_w, jockey_w = get_weight_ratio({"rcDist": 2000, "weather": "맑음", "track": "양"}, [])
        assert horse_w == 0.6
        assert jockey_w == 0.4
