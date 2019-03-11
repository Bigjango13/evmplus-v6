import { Schema } from '@mysql/xdevapi';
import {
	MemberReference,
	NoSQLDocument,
	NotificationCause,
	NotificationMemberCause,
	NotificationObject,
	NotificationSystemCause
} from 'common-lib';
import { NotificationCauseType, NotificationTargetType } from 'common-lib/index';
import Account from '../Account';
import MemberBase from '../Members';
import { Notification } from '../Notification';

export default class MemberNotification extends Notification {
	public static async CreateNotification(
		text: string,
		to: MemberReference | MemberBase,
		from: NotificationSystemCause,
		account: Account,
		schema: Schema
	): Promise<MemberNotification>;
	public static async CreateNotification(
		text: string,
		to: MemberReference | MemberBase,
		from: NotificationMemberCause,
		account: Account,
		schema: Schema,
		fromMember: MemberBase
	): Promise<MemberNotification>;

	public static async CreateNotification(
		text: string,
		to: MemberReference | MemberBase,
		from: NotificationCause,
		account: Account,
		schema: Schema,
		fromMember?: MemberBase
	) {
		const results = await this.Create(
			{
				cause: from,
				text
			},
			{
				type: NotificationTargetType.MEMBER,
				to: to instanceof MemberBase ? to.getReference() : to
			},
			account,
			schema
		);

		let toMemberName: string;

		if (to instanceof MemberBase) {
			toMemberName = to.getFullName();
		} else {
			const toMember = await MemberBase.ResolveReference(to, account, schema);

			toMemberName = toMember.getFullName();
		}

		return new MemberNotification(
			{
				...results,
				fromMemberName:
					from.type === NotificationCauseType.MEMBER ? fromMember.getFullName() : null,
				toMemberName
			},
			account,
			schema
		);
	}

	public constructor(
		data: NotificationObject & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		super(data, account, schema);
	}
}
