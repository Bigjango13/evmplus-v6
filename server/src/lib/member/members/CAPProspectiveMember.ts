import { Schema } from '@mysql/xdevapi';
import {
	AbsenteeInformation,
	ExtraMemberInformation,
	NoSQLDocument,
	ProspectiveMemberObject,
	ProspectiveMemberReference,
	RawProspectiveMemberObject,
	ShortDutyPosition,
	TemporaryDutyPosition
} from 'common-lib';
import Account from '../../Account';
import MemberBase from '../../Members';
import { collectResults, findAndBind, generateResults } from '../../MySQLUtil';
import { SessionedUser } from '../pam/Session';

export default class CAPProspectiveMember extends MemberBase
	implements ProspectiveMemberObject, Required<NoSQLDocument> {
	public static async Create(
		newMember: RawProspectiveMemberObject,
		account: Account,
		schema: Schema
	): Promise<CAPProspectiveMember> {
		const prospectiveCollection = schema.getCollection<RawProspectiveMemberObject>(
			CAPProspectiveMember.tableName
		);

		let id: string = `${account.id}-`;
		let highestNumber: number = 0;

		const iterator = generateResults(
			findAndBind(prospectiveCollection, {
				accountID: account.id
			})
		);

		for await (const prospectiveMember of iterator) {
			const match = (prospectiveMember.id.match(/([0-9])*$/) || [])[1];
			const numberPortion = parseInt(match, 10);

			highestNumber = Math.max(numberPortion, highestNumber);
		}

		id += highestNumber + 1;

		// tslint:disable-next-line:variable-name
		const _id = (await prospectiveCollection
			.add({
				...newMember,
				id,
				accountID: account.id,
				type: 'CAPProspectiveMember'
			})
			.execute()).getGeneratedIds()[0];

		const extraInformation = await CAPProspectiveMember.LoadExtraMemberInformation(
			{
				id,
				type: 'CAPProspectiveMember'
			},
			schema,
			account
		);

		return new CAPProspectiveMember(
			{
				_id,
				...newMember,
				accountID: account.id,
				type: 'CAPProspectiveMember',
				squadron: account.getSquadronName(),
				absenteeInformation: null
			},
			schema,
			account,
			extraInformation
		);
	}

	public static async Get(
		id: string,
		account: Account,
		schema: Schema
	): Promise<CAPProspectiveMember> {
		const prospectiveCollection = schema.getCollection<RawProspectiveMemberObject>(
			CAPProspectiveMember.tableName
		);

		const results = await collectResults(
			findAndBind(prospectiveCollection, { id, accountID: account.id })
		);

		if (results.length !== 1) {
			throw new Error('Could not get member');
		}

		const extraInformation = await CAPProspectiveMember.LoadExtraMemberInformation(
			{
				id,
				type: 'CAPProspectiveMember'
			},
			schema,
			account
		);

		return new CAPProspectiveMember(results[0], schema, account, extraInformation);
	}

	private static tableName = 'ProspectiveMembers';

	/**
	 * Limit prospective member IDs to strings
	 */
	public id: string;
	/**
	 * Used to differentiate between users
	 */
	public type = 'CAPProspectiveMember' as const;
	/**
	 * Records the rank of the user
	 */
	public memberRank: string;
	/**
	 * Records the account this member belongs to
	 */
	public accountID: string;
	/**
	 * Records the flight this member is a part of
	 */
	public flight: string | null;
	/**
	 * Records absentee information about this member
	 */
	public absenteeInformation: AbsenteeInformation | null;
	/**
	 * Stores the duty positions of this member
	 */
	public dutyPositions: ShortDutyPosition[];
	/**
	 * Whether or not this member is a senior member
	 */
	public seniorMember: boolean;
	/**
	 * The squadron this member is a part of
	 */
	public squadron: string;
	/**
	 * The organization this member is a part of
	 */
	public orgid: number;
	/**
	 * The id in the database that holds information for this member
	 */
	// tslint:disable-next-line: variable-name
	public _id: string;

	public constructor(
		data: ProspectiveMemberObject,
		schema: Schema,
		requestingAccount: Account,
		extraInformation: ExtraMemberInformation
	) {
		super(data, schema, requestingAccount, extraInformation);
	}

	public getHomeAccount = () => Account.Get(this.accountID, this.schema);

	public async *getAccounts () {
		yield this.getHomeAccount();
	}

	public getReference = (): ProspectiveMemberReference => ({
		type: 'CAPProspectiveMember',
		id: this.id
	});

	public async save() {
		const prospectiveCollection = this.schema.getCollection<RawProspectiveMemberObject>(
			CAPProspectiveMember.tableName
		);

		await prospectiveCollection.replaceOne(this._id, this.toRaw());
	}

	public addTemporaryDutyPosition(position: TemporaryDutyPosition) {
		for (const tempPosition of this.extraInformation.temporaryDutyPositions) {
			if (tempPosition.Duty === position.Duty) {
				tempPosition.validUntil = position.validUntil;
				tempPosition.assigned = position.assigned;
				return;
			}
		}

		this.extraInformation.temporaryDutyPositions.push({
			Duty: position.Duty,
			assigned: position.assigned,
			validUntil: position.validUntil
		});

		this.updateDutyPositions();
	}

	public removeDutyPosition(duty: string) {
		if (this.extraInformation.temporaryDutyPositions.length === 0) {
			this.updateDutyPositions();
			return;
		}
		for (let i = this.extraInformation.temporaryDutyPositions.length - 1; i >= 0; i--) {
			if (this.extraInformation.temporaryDutyPositions[i].Duty === duty) {
				this.extraInformation.temporaryDutyPositions.splice(i, 1);
			}
		}

		this.updateDutyPositions();
	}

	public hasDutyPosition = (dutyPosition: string | string[]): boolean =>
		typeof dutyPosition === 'string'
			? this.dutyPositions.filter(duty => duty.duty === dutyPosition).length > 0
			: dutyPosition.map(this.hasDutyPosition).reduce((a, b) => a || b, false);

	public toRaw(): RawProspectiveMemberObject {
		return {
			...super.toRaw(),
			id: this.id,
			type: 'CAPProspectiveMember',
			flight: this.flight,
			dutyPositions: this.dutyPositions,
			memberRank: this.memberRank,
			seniorMember: this.seniorMember,
			squadron: this.squadron,
			orgid: this.orgid,
			accountID: this.accountID
		};
	}

	private updateDutyPositions() {
		this.dutyPositions = [
			...this.dutyPositions.filter(v => v.type === 'NHQ'),
			...this.extraInformation.temporaryDutyPositions.map(v => ({
				type: 'CAPUnit' as 'CAPUnit',
				expires: v.validUntil,
				duty: v.Duty,
				date: v.assigned
			}))
		];
	}
}

export class CAPProspectiveUser extends SessionedUser(CAPProspectiveMember) {}
