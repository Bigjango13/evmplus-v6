import Account from '../Account';
import MemberBase from '../MemberBase';

export default class CAPProspectiveMember extends MemberBase
	implements ProspectiveMemberObject {
	/**
	 * The ID of the user
	 */
	public id: string = '';
	/**
	 * The password, ignored because the password is never sent to the clients
	 */
	public password: '' = '';
	/**
	 * The password salt, ignored because the password is never sent to the clients
	 */
	public salt: '' = '';
	/**
	 * The rank of the member
	 */
	public memberRank: string = '';
	/**
	 * The member name + the member rank
	 */
	public memberRankName: string = '';
	/**
	 * Duty positions
	 */
	public dutyPositions: string[] = [];
	/**
	 * The organization ID the user belongs to
	 */
	public orgid: number = 0;
	/**
	 * The flight for a member, if a cadet
	 */
	public flight: string;

	public type: 'CAPProspectiveMember' = 'CAPProspectiveMember';

	public constructor(
		data: CAPMemberObject,
		requestingAccount: Account,
		sessionID: string
	) {
		super(data, requestingAccount, sessionID);
	}

	public getReference = (): MemberReference => ({
		id: this.id,
		type: 'CAPProspectiveMember'
	});

	public toRaw(): ProspectiveMemberObject {
		return {
			contact: this.contact,
			password: '',
			salt: '',
			dutyPositions: this.dutyPositions,
			flight: this.flight,
			id: this.id,
			memberRank: this.memberRank,
			nameFirst: this.nameFirst,
			nameLast: this.nameLast,
			nameMiddle: this.nameMiddle,
			nameSuffix: this.nameSuffix,
			orgid: this.orgid,
			permissions: this.permissions,
			seniorMember: this.seniorMember,
			squadron: this.squadron,
			teamIDs: this.teamIDs,
			type: 'CAPProspectiveMember',
			usrID: this.usrID,
			accountID: this.accountID
		};
	}
}
