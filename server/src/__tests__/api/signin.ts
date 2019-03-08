import { Schema } from '@mysql/xdevapi';
import { SigninReturn } from 'common-lib';
import { Server } from 'http';
import * as request from 'supertest';
import { default as conf, default as conftest } from '../../conf.test';
import getServer from '../../getServer';
import Account from '../../lib/Account';
import { ProspectiveMember } from '../../lib/Members';
import { getTestTools } from '../../lib/Util';
import { newMem, password, signinInformation } from '../consts';

describe('/api', () => {
	describe('/signin', () => {
		let server: Server;
		let pmember: ProspectiveMember;
		let account: Account;
		let schema: Schema;

		beforeAll(async () => {
			const results = await getTestTools(conftest);

			account = results.account;
			schema = results.schema;
		});

		beforeEach(async () => {
			server = (await getServer(conf, 3004)).server;
		});

		afterEach(async () => {
			server.close();
		});

		afterAll(async () => {
			await schema
				.getCollection('ProspectiveMembers')
				.remove('true')
				.execute();
		});

		it('should sign in correctly', done => {
			request(server)
				.post('/api/signin')
				.send(signinInformation)
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(200)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					// -1 means no error
					expect(ret.error).toEqual(-1);
					expect(ret.sessionID).not.toEqual('');
					expect(ret.valid).toEqual(true);
					expect(ret.member ? ret.member.id : 0).toEqual(signinInformation.username);

					done();
				});
		}, 8000);

		it('should return an error when using incorrect credentials', done => {
			request(server)
				.post('/api/signin')
				.send({
					...signinInformation,
					password: 'incorrect'
				})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(400)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					// See lib/index.d.ts#MemberCreateError
					// It represents INCORRECT_CREDENTIALS, but unit tests cannot access
					// global types
					expect(ret.error).toEqual(0);
					expect(ret.sessionID).toEqual('');
					expect(ret.valid).toEqual(false);
					expect(ret.member).toEqual(null);

					done();
				});
		});

		it('should succeed when using a username instead of id', done => {
			request(server)
				.post('/api/signin')
				.send({
					...signinInformation,
					username: 'riouxad'
				})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					// -1 means no error
					expect(ret.error).toEqual(-1);
					expect(ret.sessionID).not.toEqual('');
					expect(ret.valid).toEqual(true);
					expect(ret.member ? ret.member.id : 0).toEqual(signinInformation.username);

					done();
				});
		}, 8000);

		it('should be able to get a user after signing in', done => {
			request(server)
				.post('/api/signin')
				.send(signinInformation)
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.end((err, res) => {
					if (err) {
						throw err;
					}

					request(server)
						.post('/api/check')
						.set('Accept', 'application/json')
						.set('Authorization', res.body.sessionID)
						.expect(200)
						.end((err1, res1) => {
							if (err) {
								throw err;
							}

							const ret: SigninReturn = res.body;

							expect(ret.error).toEqual(-1);
							expect(ret.sessionID).not.toEqual('');
							expect(ret.valid).toEqual(true);
							expect(ret.member ? ret.member.id : 0).toEqual(
								signinInformation.username
							);

							done();
						});
				});
		}, 8000);

		it('should allow signing in as a prospective member', async done => {
			pmember = await ProspectiveMember.Create(newMem, password, account, schema);

			request(server)
				.post('/api/signin')
				.send({
					username: pmember.id,
					password
				})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					// -1 means no error
					expect(ret.error).toEqual(-1);
					expect(ret.sessionID).not.toEqual('');
					expect(ret.valid).toEqual(true);
					expect(ret.member ? ret.member.id : 0).toEqual(pmember.id);

					done();
				});
		});

		it('should allow signing in as a prospective member case insensitive', async done => {
			pmember = await ProspectiveMember.Create(newMem, password, account, schema);

			request(server)
				.post('/api/signin')
				.send({
					username: pmember.id.toUpperCase(),
					password
				})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					// -1 means no error
					expect(ret.error).toEqual(-1);
					expect(ret.sessionID).not.toEqual('');
					expect(ret.valid).toEqual(true);
					expect(ret.member ? ret.member.id : 0).toEqual(pmember.id);

					done();
				});
		});

		it('should return an error for incorrect credentials for a prospective member', async done => {
			request(server)
				.post('/api/signin')
				.send({
					username: 'nothing-12',
					password: 'no-user'
				})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.end((err, res) => {
					if (err) {
						throw err;
					}

					const ret: SigninReturn = res.body;

					expect(ret.error).toEqual(0);
					expect(ret.sessionID).toEqual('');
					expect(ret.valid).toEqual(false);
					expect(ret.member).toEqual(null);

					done();
				});
		});

		it('should return a signin form to sign in with', done => {
			request(server)
				.get('/api/signin')
				.expect(200)
				.end((err, res) => {
					if (err) {
						throw err;
					}

					expect(res.get('Content-type')).toMatch('text/html');

					done();
				});
		});
	});
});
