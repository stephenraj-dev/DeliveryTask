"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const User_schema_1 = require("../schemas/User.schema");
const orders_service_1 = require("../orders/orders.service");
const app_gateway_1 = require("../sockets/app/app.gateway");
const ioredis_1 = require("ioredis");
let RidersService = class RidersService {
    userModel;
    ordersService;
    appGateway;
    redisClient;
    constructor(userModel, ordersService, appGateway, redisClient) {
        this.userModel = userModel;
        this.ordersService = ordersService;
        this.appGateway = appGateway;
        this.redisClient = redisClient;
    }
    async findAll() { return this.userModel.find({ role: 'rider' }); }
    async updateStatus(id, status) {
        const rider = await this.userModel.findByIdAndUpdate(id, { status }, { new: true });
        if (status === 'offline') {
            await this.ordersService.reassignOrdersFromRider(id);
        }
        return rider;
    }
    async updateLocation(data) {
        await this.redisClient.set(`rider_location:${data.riderId}`, JSON.stringify({ lat: data.lat, lng: data.lng }), 'EX', 3600);
        this.appGateway.emitLocationUpdate(data.riderId, data.lat, data.lng);
        return { success: true };
    }
};
exports.RidersService = RidersService;
exports.RidersService = RidersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(User_schema_1.User.name)),
    __param(3, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        orders_service_1.OrdersService,
        app_gateway_1.AppGateway,
        ioredis_1.Redis])
], RidersService);
//# sourceMappingURL=riders.service.js.map