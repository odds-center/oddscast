"use strict";
/**
 * API 응답 공통 타입
 * Server ResponseInterceptor: { data, status, message? }
 * webapp, mobile, admin, server 모두 사용
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["TICKET_REQUIRED"] = "TICKET_REQUIRED";
    ErrorCode["INSUFFICIENT_TICKETS"] = "INSUFFICIENT_TICKETS";
    ErrorCode["PREDICTION_NOT_FOUND"] = "PREDICTION_NOT_FOUND";
    ErrorCode["PREDICTION_GENERATING"] = "PREDICTION_GENERATING";
    ErrorCode["PREDICTION_FAILED"] = "PREDICTION_FAILED";
    ErrorCode["RACE_NOT_FOUND"] = "RACE_NOT_FOUND";
    ErrorCode["RACE_ALREADY_STARTED"] = "RACE_ALREADY_STARTED";
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
