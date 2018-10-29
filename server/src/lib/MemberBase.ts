import { Schema } from '@mysql/xdevapi';
import Account from './Account';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';
import Team from './Team';

export default abstract class MemberBase implements MemberObject {
	public static GetMemberTypeFromID(inputID: string): MemberType {
		if (inputID.match(/[a-z0-9]{1,15}-\d*/i)) {
			return 'CAPProspectiveMember';
		}
		if (inputID.match(/(([a-z]*)|(\d{6}))/i)) {
			return 'CAPNHQMember';
		}
	}

	public static IsRioux = (cm: MemberBase | number | string): boolean =>
		typeof cm === 'string'
			? false
			: typeof cm === 'number'
				? cm === 542488 || cm === 546319
				: cm.isRioux;

	public static GetUserID(name: string[]) {
		let usrID = '';

		usrID = name[2] + name[0] + name[1];

		return usrID;
	}

	public static ResolveReference(
		ref: MemberReference,
		account: Account,
		schema: Schema,
		errOnNull?: false 
	): Promise<CAPWATCHMember | ProspectiveMember | null>;
	public static ResolveReference(
		ref: MemberReference,
		account: Account,
		schema: Schema,
		errOnNull: true
	): Promise<CAPWATCHMember | ProspectiveMember>;

	public static ResolveReference(
		ref: MemberReference,
		account: Account,
		schema: Schema,
		errOnNull: boolean = false
	): Promise<CAPWATCHMember | ProspectiveMember | null> {
		switch (ref.type) {
			case 'Null':
				if (errOnNull) {
					throw new Error('Null member');
				}
				return null;

			case 'CAPNHQMember':
				return CAPWATCHMember.Get(ref.id, account, schema);

			case 'CAPProspectiveMember':
				return ProspectiveMember.GetProspective(
					ref.id,
					account,
					schema
				);
		}
	}

	public static AreMemberReferencesTheSame(
		ref1: MemberReference,
		ref2: MemberReference
	) {
		if (ref1.type === 'Null' || ref2.type === 'Null') {
			return false;
		}

		return ref1.id === ref2.id;
	}

	/**
	 * Used to sign JWTs
	 */
	protected static secret: string =
		'MIIJKAIBAAKCAgEAo+cX1jG057if3MHajFmd5DR0h6e';

	protected static async LoadExtraMemberInformation(
		id: number,
		schema: Schema,
		account: Account
	): Promise<ExtraMemberInformation> {
		const extraMemberSchema = schema.getCollection<ExtraMemberInformation>(
			'ExtraMemberInformation'
		);
		const results = await collectResults(
			findAndBind(extraMemberSchema, {
				id,
				accountID: account.id
			})
		);

		if (results.length === 0) {
			const newInformation: ExtraMemberInformation = {
				accessLevel: 'Member',
				accountID: account.id,
				id,
				temporaryDutyPositions: [],
				flight: null,
				teamIDs: []
			};

			extraMemberSchema.add(newInformation).execute();

			return newInformation;
		}

		return results[0];
	}

	/**
	 * CAPID
	 */
	public id: number | string = 0;
	/**
	 * Contact information
	 */
	public contact: CAPMemberContact = {
		ALPHAPAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		ASSISTANT: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CADETPARENTEMAIL: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CADETPARENTPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CELLPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		DIGITALPAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		EMAIL: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		HOMEFAX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		HOMEPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		INSTANTMESSAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		ISDN: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		RADIO: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		TELEX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		WORKFAX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		WORKPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' }
	};
	/**
	 * Member squardon
	 */
	public squadron: string = '';
	/**
	 * The first name of the member
	 */
	public nameFirst: string = '';
	/**
	 * The middle name of the member
	 */
	public nameMiddle: string = '';
	/**
	 * The last name of the member
	 */
	public nameLast: string = '';
	/**
	 * The suffix of the user
	 */
	public nameSuffix: string = '';
	/**
	 * The User ID, usually can be used for logins
	 */
	public usrID: string = '';
	/**
	 * The IDs of teams the member is a part of
	 */
	public teamIDs: number[] = [];
	/**
	 * Whether or not the user is Rioux
	 */
	public readonly isRioux: boolean = false;
	/**
	 * Checks for if a user has permissions
	 */
	public abstract permissions: MemberPermissions;
	/**
	 * Cheap way to produce references
	 */
	public abstract getReference: () => MemberReference;

	/**
	 * Used to differentiate when using polymorphism
	 *
	 * Another method is the instanceof operator, but to each their own
	 * That method would probably work better however
	 */
	public abstract type: MemberType;

	public constructor(
		data: MemberObject,
		protected schema: Schema,
		protected requestingAccount: Account
	) {
		Object.assign(this, data);

		this.isRioux = data.id === 542488 || data.id === 546319;
	}

	public getName = (): string =>
		[this.nameFirst, this.nameMiddle, this.nameLast, this.nameSuffix]
			.filter(s => !!s)
			.join(' ');

	public toRaw = (): MemberObject => ({
		id: this.id,
		contact: this.contact,
		nameFirst: this.nameFirst,
		nameLast: this.nameLast,
		nameMiddle: this.nameMiddle,
		nameSuffix: this.nameSuffix,
		usrID: this.usrID,
		type: this.type,
		permissions: this.permissions,
		teamIDs: this.teamIDs
	});

	public async *getTeams(): AsyncIterableIterator<Team> {
		const teamsCollection = this.schema.getCollection<TeamObject>('Teams');

		const reference = this.getReference();

		const teamFind = teamsCollection.find(':members in members').bind({
			members: reference
		});

		const generator = generateResults(teamFind);

		for await (const i of generator) {
			yield Team.Get(i.id, this.requestingAccount, this.schema);
		}
	}

	public matchesReference(ref: MemberReference): boolean {
		return ref.type === this.type && ref.id === this.id;
	}
}

import CAPWATCHMember from './members/CAPWATCHMember';
import ProspectiveMember from './members/ProspectiveMember';

export { ConditionalMemberRequest, MemberRequest } from './members/NHQMember';
