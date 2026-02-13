"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.JwtPayload = void 0;
const common_1 = require("@nestjs/common");
class JwtPayload {
}
exports.JwtPayload = JwtPayload;
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
//# sourceMappingURL=current-user.decorator.js.map