import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { Redis } from 'ioredis';

describe('Mini Logistics Platform (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let redisClient: Redis;
  
  let adminToken: string;
  let clientToken: string;
  let riderToken: string;
  let orderId: string;
  let riderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    mongoConnection = app.get(getConnectionToken());
    redisClient = app.get('REDIS_CLIENT');

    // Clean DB
    await mongoConnection.dropDatabase();
    await redisClient.flushall();
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await app.close();
  });

  describe('1. Auth Module', () => {
    it('TC-AUTH-001: Register admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Admin', email: 'admin@test.com', password: 'password', role: 'admin' })
        .expect(201);
      expect(res.body.token).toBeDefined();
    });

    it('TC-AUTH-002: Register client', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Client', email: 'client@test.com', password: 'password', role: 'client' })
        .expect(201);
      expect(res.body.token).toBeDefined();
      clientToken = res.body.token;
    });

    it('TC-AUTH-003: Register rider', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Rider', email: 'rider@test.com', password: 'password', role: 'rider' })
        .expect(201);
      expect(res.body.token).toBeDefined();
      riderId = res.body.user.id;
    });

    it('TC-AUTH-004: Duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Rider2', email: 'rider@test.com', password: 'password', role: 'rider' })
        .expect(409);
    });

    it('TC-AUTH-005: Invalid role', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Super', email: 'super@test.com', password: 'password', role: 'superadmin' })
        .expect(400);
    });

    it('TC-AUTH-006: Missing fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Client2', email: 'client2@test.com', role: 'client' }) // missing password
        .expect(400);
    });

    it('TC-AUTH-007: Login admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password' })
        .expect(201);
      expect(res.body.token).toBeDefined();
      adminToken = res.body.token;
    });

    it('TC-AUTH-008: Incorrect password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'wrong' })
        .expect(401);
    });

    it('TC-AUTH-009: Non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'password' })
        .expect(401);
    });
    
    it('TC-AUTH-010: Missing credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com' })
        .expect(400);
    });
  });

  describe('2. Riders Prep', () => {
    it('Login rider and make available', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'rider@test.com', password: 'password' })
        .expect(201);
      riderToken = res.body.token;

      await request(app.getHttpServer())
        .patch(`/riders/${riderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'available' })
        .expect(200);
    });
  });

  describe('3. Orders Module', () => {
    it('TC-ORD-001: Create normal priority order', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ pickupAddress: 'A', dropAddress: 'B', packageDetails: 'Box', priority: 'normal' })
        .expect(201);
      expect(res.body.status).toBe('assigned');
      orderId = res.body._id;
    });

    it('TC-ORD-004: Create without token', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({ pickupAddress: 'A', dropAddress: 'B', packageDetails: 'Box', priority: 'normal' })
        .expect(401);
    });

    it('TC-ORD-005: Create missing fields', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ pickupAddress: 'A', dropAddress: 'B' }) // missing priority/details
        .expect(400);
    });

    it('TC-ORD-006: Admin fetches all orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('TC-ORD-009: Client fetch all orders (Forbidden)', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('TC-ORD-010: Client fetches my orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders/my')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('TC-ORD-011: Admin fetch my orders (Forbidden)', () => {
      return request(app.getHttpServer())
        .get('/orders/my')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('TC-ORD-012: Rider updates to picked_up', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'picked_up' })
        .expect(200);
    });

    it('TC-ORD-015: Invalid status flow', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'pending' }) // picked_up to pending is invalid
        .expect(400);
    });

    it('TC-ORD-013: Rider updates to delivered', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'delivered', proofPhoto: 'some-url' })
        .expect(200);
    });
  });

  describe('4. Riders Module API', () => {
    it('TC-RID-001: Admin fetches all riders', async () => {
      const res = await request(app.getHttpServer())
        .get('/riders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('TC-RID-002: Client fetches all riders (Forbidden)', () => {
      return request(app.getHttpServer())
        .get('/riders')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('TC-RID-006: Rider updates location', async () => {
      await request(app.getHttpServer())
        .patch('/riders/location')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ lat: 12.9716, lng: 77.5946 })
        .expect(200);
    });

    it('TC-RID-007: Rider updates location invalid format', () => {
      return request(app.getHttpServer())
        .patch('/riders/location')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ lat: 'abc', lng: 77.5946 }) // invalid type
        .expect(400);
    });
  });

  describe('5. Analytics Module', () => {
    it('TC-ANA-001: Admin fetches analytics', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.totalOrders).toBeDefined();
      expect(res.body.delivered).toBeDefined();
    });

    it('TC-ANA-004: Client fetches analytics (Forbidden)', () => {
      return request(app.getHttpServer())
        .get('/analytics/summary')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });
});
