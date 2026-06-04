"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidersModule = void 0;
const common_1 = require("@nestjs/common");
const riders_controller_1 = require("./riders.controller");
const riders_service_1 = require("./riders.service");
const mongoose_1 = require("@nestjs/mongoose");
const User_schema_1 = require("../schemas/User.schema");
const orders_module_1 = require("../orders/orders.module");
let RidersModule = class RidersModule {
};
exports.RidersModule = RidersModule;
exports.RidersModule = RidersModule = __decorate([
    (0, common_1.Module)({
        imports: [mongoose_1.MongooseModule.forFeature([{ name: User_schema_1.User.name, schema: User_schema_1.UserSchema }]), orders_module_1.OrdersModule],
        controllers: [riders_controller_1.RidersController],
        providers: [riders_service_1.RidersService]
    })
], RidersModule);
//# sourceMappingURL=riders.module.js.map