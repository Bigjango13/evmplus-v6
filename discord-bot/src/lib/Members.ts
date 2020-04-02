import { Schema } from '@mysql/xdevapi';
import { fromValue, MemberObject, MemberReference } from 'common-lib';
// Members
import MemberBase from './member/MemberBase';
import CAPNHQMember from './member/members/CAPNHQMember';
import CAPProspectiveMember from './member/members/CAPProspectiveMember';
import Account from './Account';

export * from './member/MemberBase';
export * from './member/members/CAPNHQMember';
export * from './member/members/CAPProspectiveMember';
export { CAPProspectiveMember, CAPNHQMember };

export default MemberBase;

export type CAPMemberClasses = CAPProspectiveMember | CAPNHQMember;
export type MemberClasses = CAPMemberClasses;

export function getBestPhone(member: MemberObject) {
	if (member.contact.CELLPHONE.PRIMARY) {
		return { contact: member.contact.CELLPHONE.PRIMARY, source: 'CP' };
	} else if (member.contact.HOMEPHONE.PRIMARY) {
		return { contact: member.contact.HOMEPHONE.PRIMARY, source: 'HP' };
	} else if (member.contact.CELLPHONE.SECONDARY) {
		return { contact: member.contact.CELLPHONE.SECONDARY, source: 'CS' };
	} else if (member.contact.HOMEPHONE.SECONDARY) {
		return { contact: member.contact.HOMEPHONE.SECONDARY, source: 'HS' };
	} else if (member.contact.CADETPARENTPHONE.PRIMARY) {
		return { contact: member.contact.CADETPARENTPHONE.PRIMARY, source: 'PP' };
	} else if (member.contact.CADETPARENTPHONE.SECONDARY) {
		return { contact: member.contact.CADETPARENTPHONE.SECONDARY, source: 'PS' };
	} else if (member.contact.WORKPHONE.PRIMARY) {
		return { contact: member.contact.WORKPHONE.PRIMARY, source: 'WP' };
	} else if (member.contact.WORKPHONE.SECONDARY) {
		return { contact: member.contact.WORKPHONE.SECONDARY, source: 'WS' };
	} else {
		return { contact: null, source: null };
	}
}

export function getEmerPhone(member: MemberObject) {
	if (member.contact.CELLPHONE.EMERGENCY) {
		return { contact: member.contact.CELLPHONE.EMERGENCY, source: 'CE' };
	} else if (member.contact.HOMEPHONE.EMERGENCY) {
		return { contact: member.contact.HOMEPHONE.EMERGENCY, source: 'HE' };
	} else if (member.contact.CADETPARENTPHONE.EMERGENCY) {
		return { contact: member.contact.CADETPARENTPHONE.EMERGENCY, source: 'PE' };
	} else if (member.contact.WORKPHONE.EMERGENCY) {
		return { contact: member.contact.WORKPHONE.EMERGENCY, source: 'WE' };
	} else {
		return { contact: null, source: null };
	}
}

export const getEmail = (member: MemberObject) =>
	fromValue(
		member.contact.EMAIL.PRIMARY ||
			member.contact.CADETPARENTEMAIL.PRIMARY ||
			member.contact.EMAIL.PRIMARY ||
			member.contact.CADETPARENTPHONE.SECONDARY ||
			member.contact.EMAIL.EMERGENCY ||
			member.contact.CADETPARENTEMAIL.EMERGENCY
	);

export function getBestEmail(member: MemberObject) {
	if (member.contact.EMAIL.PRIMARY) {
		return { contact: member.contact.EMAIL.PRIMARY, source: 'EP' };
	} else if (member.contact.EMAIL.SECONDARY) {
		return { contact: member.contact.EMAIL.SECONDARY, source: 'ES' };
	} else if (member.contact.CADETPARENTEMAIL.PRIMARY) {
		return { contact: member.contact.CADETPARENTEMAIL.PRIMARY, source: 'PP' };
	} else if (member.contact.CADETPARENTEMAIL.SECONDARY) {
		return { contact: member.contact.CADETPARENTEMAIL.SECONDARY, source: 'PS' };
	} else if (member.contact.EMAIL.EMERGENCY) {
		return { contact: member.contact.EMAIL.EMERGENCY, source: 'EE' };
	} else if (member.contact.CADETPARENTEMAIL.EMERGENCY) {
		return { contact: member.contact.CADETPARENTEMAIL.EMERGENCY, source: 'PE' };
	} else {
		return { contact: null, source: null };
	}
}

export function resolveReference(
	ref: MemberReference,
	account: Account,
	schema: Schema,
	errOnNull?: false
): Promise<MemberClasses | null>;
export function resolveReference(
	ref: MemberReference,
	account: Account,
	schema: Schema,
	errOnNull: true
): Promise<MemberClasses>;
export async function resolveReference(
	ref: MemberReference,
	account: Account,
	schema: Schema,
	errOnNull = false
): Promise<MemberClasses | null> {
	switch (ref.type) {
		case 'Null':
			if (errOnNull) {
				throw new Error('Null member');
			}
			return Promise.resolve(null);

		case 'CAPNHQMember':
			return CAPNHQMember.Get(ref.id, account, schema);

		case 'CAPProspectiveMember':
			return CAPProspectiveMember.Get(ref.id, account, schema);
	}
}

export function isRioux(cm: MemberBase | number | string): boolean {
	if (typeof cm === 'number' || typeof cm === 'string') {
		return cm === 542488 || cm === 546319;
	}

	if (cm instanceof MemberBase) {
		return cm.isRioux;
	}

	return false;
}

export function getUserID(name: string[]): string {
	let usrID = '';

	usrID = name[2] + ((name[0] || '')[0] || '') + ((name[1] || '')[0] || '');

	return usrID.toLocaleLowerCase();
}

export function isValidMemberReference(value: any): value is MemberReference {
	if (typeof value !== 'object' || value === null || value === undefined) {
		return false;
	}

	if (typeof value.type === 'undefined') {
		return false;
	}

	if (value.type === 'Null') {
		return true;
	}

	if (value.type === 'CAPNHQMember' && typeof value.id === 'number') {
		return true;
	}

	if (value.type === 'CAPProspectiveMember' && typeof value.id === 'string') {
		return true;
	}

	return false;
}

export function areMemberReferencesTheSame(ref1: MemberReference, ref2: MemberReference) {
	if (ref1.type === 'Null' || ref2.type === 'Null') {
		return false;
	}

	return ref1.id === ref2.id && ref1.type === ref2.type;
}
