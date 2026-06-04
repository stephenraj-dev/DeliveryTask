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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const Order_schema_1 = require("../schemas/Order.schema");
const ioredis_1 = require("ioredis");
let AnalyticsService = class AnalyticsService {
    orderModel;
    redisClient;
    constructor(orderModel, redisClient) {
        this.orderModel = orderModel;
        this.redisClient = redisClient;
    }
    async getSummary() {
        const cached = await this.redisClient.get('analytics:summary');
        if (cached) {
            return JSON.parse(cached);
        }
        const totalOrders = await this.orderModel.countDocuments();
        const delivered = await this.orderModel.countDocuments({ status: 'delivered' });
        const failed = await this.orderModel.countDocuments({ status: 'failed' });
        const pending = totalOrders - delivered - failed;
        const successRate = totalOrders ? (delivered / totalOrders) * 100 : 0;
        const avgTimeRes = await this.orderModel.aggregate([
            { $match: { status: 'delivered', timeTaken: { $exists: true } } },
            { $group: { _id: null, avgTime: { $avg: '$timeTaken' } } }
        ]);
        const avgDeliveryTime = avgTimeRes[0]?.avgTime || 0;
        const riderPerformance = await this.orderModel.aggregate([
            { $match: { status: { $in: ['delivered', 'failed'] } } },
            {
                $group: {
                    _id: '$riderId',
                    delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    avgTime: { $avg: '$timeTaken' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'rider'
                }
            },
            { $unwind: '$rider' },
            {
                $project: {
                    _id: 0,
                    riderName: '$rider.name',
                    delivered: 1,
                    failed: 1,
                    avgTime: 1,
                    rating: { $literal: 4.5 }
                }
            }
        ]);
        const zoneWiseSummary = await this.orderModel.aggregate([
            { $match: { zone: { $exists: true } } },
            {
                $group: {
                    _id: '$zone',
                    totalOrders: { $sum: 1 },
                    delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    zone: '$_id',
                    totalOrders: 1,
                    successRate: { $multiply: [{ $divide: ['$delivered', { $max: ['$totalOrders', 1] }] }, 100] }
                }
            }
        ]);
        const summary = {
            totalOrders,
            delivered,
            failed,
            pending,
            avgDeliveryTime,
            successRate,
            peakHour: '18:00 - 19:00',
            riderPerformance,
            zoneWiseSummary
        };
        await this.redisClient.set('analytics:summary', JSON.stringify(summary), 'EX', 60);
        return summary;
    }
    async invalidateCache() {
        await this.redisClient.del('analytics:summary');
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(Order_schema_1.Order.name)),
    __param(1, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        ioredis_1.Redis])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map