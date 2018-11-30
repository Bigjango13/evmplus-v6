import { Schema } from '@mysql/xdevapi';
import conftest from '../../../conf.test';
import Account from '../../../lib/Account';
import { hashPassword, ProspectiveMember } from '../../../lib/Members';
import { getTestTools } from '../../../lib/Util';
import { newMem, password } from '../../consts';

describe('ProspectiveMember', () => {
	let mem: ProspectiveMember;
	let schema: Schema;
	let account: Account;

	beforeAll(async done => {
		const results = await getTestTools(conftest);

		schema = results.schema;
		account = results.account;

		await schema
			.getCollection('ProspectiveMembers')
			.remove('true')
			.execute();

		done();
	});

	it('should create a member correctly', async () => {
		const newProspMember = ProspectiveMember.Create(
			newMem,
			password,
			account,
			schema
		);

		await expect(newProspMember).resolves.toBeTruthy();

		mem = await newProspMember;

		expect(mem.id).toEqual('mdx89-1');
		expect(mem.nameFirst).toEqual(newMem.nameFirst);
	});

	it('should get a member that was created', async () => {
		const member = await ProspectiveMember.GetProspective(
			mem.id,
			account,
			schema
		);

		expect(member.id).toEqual(mem.id);
		expect(member.nameFirst).toEqual(newMem.nameFirst);
	});

	it('should be possible to sign in as the user', async () => {
		const member = await ProspectiveMember.Signin(
			mem.id,
			password,
			account,
			schema
		);

		expect(member.id).toEqual(mem.id);
		expect(member.nameFirst).toEqual(newMem.nameFirst);
	});

	it('should fail on incorrect passwords', async () => {
		await expect(
			ProspectiveMember.Signin(
				mem.id,
				password + 'no',
				account,
				schema
			)
		).rejects.toEqual(expect.any(Error));
	});

	it('should consistently hash a password with a salt', async () => {
		for (let i = 0; i < 100; i++) {
			expect(hashPassword('test', 'asdf')).toEqual(
				hashPassword('test', 'asdf')
			);
		}
	});
});
