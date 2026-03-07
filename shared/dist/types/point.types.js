"use strict";
/**
 * 포인트 공통 타입
 * webapp, mobile, admin, server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointStatus = exports.PointTransactionType = void 0;
var PointTransactionType;
(function (PointTransactionType) {
    PointTransactionType["EARNED"] = "EARNED";
    PointTransactionType["SPENT"] = "SPENT";
    PointTransactionType["REFUNDED"] = "REFUNDED";
    PointTransactionType["BONUS"] = "BONUS";
    PointTransactionType["PROMOTION"] = "PROMOTION";
    PointTransactionType["ADMIN_ADJUSTMENT"] = "ADMIN_ADJUSTMENT";
    PointTransactionType["EXPIRED"] = "EXPIRED";
    PointTransactionType["TRANSFER_IN"] = "TRANSFER_IN";
    PointTransactionType["TRANSFER_OUT"] = "TRANSFER_OUT";
})(PointTransactionType || (exports.PointTransactionType = PointTransactionType = {}));
var PointStatus;
(function (PointStatus) {
    PointStatus["ACTIVE"] = "ACTIVE";
    PointStatus["PENDING"] = "PENDING";
    PointStatus["EXPIRED"] = "EXPIRED";
    PointStatus["CANCELLED"] = "CANCELLED";
    PointStatus["PROCESSING"] = "PROCESSING";
})(PointStatus || (exports.PointStatus = PointStatus = {}));
