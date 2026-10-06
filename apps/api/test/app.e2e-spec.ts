import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

// Necesita la base de datos corriendo (pnpm db:up) y migrada.
describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health responde ok', async () => {
    const response = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /v1/catalog rechaza idiomas no soportados', async () => {
    await request(app.getHttpServer()).get('/v1/catalog?locale=fr').expect(400);
  });

  it('POST /v1/waitlist rechaza correos inválidos', async () => {
    await request(app.getHttpServer())
      .post('/v1/waitlist')
      .send({ email: 'no-es-correo' })
      .expect(400);
  });

  it('POST /v1/webhooks/revenuecat exige el secreto', async () => {
    await request(app.getHttpServer()).post('/v1/webhooks/revenuecat').send({}).expect(401);
  });

  it('POST /v1/auth/apple rechaza tokens falsos', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/apple')
      .send({ identityToken: 'esto-no-es-un-token' })
      .expect(401);
  });

  it('GET y PUT /v1/me/progress exigen sesión', async () => {
    await request(app.getHttpServer()).get('/v1/me/progress').expect(401);
    await request(app.getHttpServer())
      .put('/v1/me/progress')
      .set('Authorization', 'Bearer falso')
      .send({})
      .expect(401);
  });

  it('GET y PUT /v1/me/sessions exigen sesión', async () => {
    await request(app.getHttpServer()).get('/v1/me/sessions').expect(401);
    await request(app.getHttpServer())
      .put('/v1/me/sessions')
      .set('Authorization', 'Bearer falso')
      .send({ sessions: [] })
      .expect(401);
  });
});
