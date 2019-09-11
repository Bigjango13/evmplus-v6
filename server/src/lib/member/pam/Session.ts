import { Schema } from '@mysql/xdevapi';
import { MemberPermission, MemberPermissions, MemberReference, SessionID, UserAccountInformation } from 'common-lib';
import { randomBytes } from 'crypto';
import { NextFunction, Response } from 'express';
import { promisify } from 'util';
import Account, { AccountRequest } from '../../Account';
import { collectResults, findAndBind, ParamType } from '../../MySQLUtil';
import { asyncErrorHandler } from '../../Util';

const promisedRandomBytes = promisify(randomBytes);

//#region Sessions

const SESSION_AGE = 10 * 60 * 1000;
const SESSION_ID_BYTE_COUNT = 64;
const SESSION_TABLE = 'Sessions';

export interface Session {
	sessionID: SessionID;
	created: number;
	userAccount: UserAccountInformation;
}

export interface ConditionalMemberRequest<P extends ParamType = {}> extends AccountRequest<P> {
	member: CAPNHQUser | CAPProspectiveUser | null;
}

export interface MemberRequest<P extends ParamType = {}> extends AccountRequest<P> {
	member: CAPNHQUser | CAPProspectiveUser;
}

const addSessionToDatabase = async (schema: Schema, session: Session) => {
	const sessionCollection = schema.getCollection<Session>(SESSION_TABLE);

	await sessionCollection.add(session).execute();
};

const removeOldSessions = async (schema: Schema) => {
	const sessionCollection = schema.getCollection<Session>(SESSION_TABLE);

	await sessionCollection
		.remove('created < :created')
		.bind({ created: Date.now() - SESSION_AGE })
		.execute();
};

const updateSessionExpireTime = async (schema: Schema, session: Session) => {
	const sessionCollection = schema.getCollection<Session>(SESSION_TABLE);

	await sessionCollection
		.modify('sessionID = :sessionID')
		.bind({
			sessionID: session.sessionID
		})
		.set('created', Date.now())
		.execute();
};

const getSessionFromID = async (schema: Schema, sessionID: SessionID) => {
	const sessionCollection = schema.getCollection<Session>(SESSION_TABLE);

	return await collectResults(findAndBind(sessionCollection, { sessionID }));
};

export const createSessionForUser = async (
	schema: Schema,
	userAccount: UserAccountInformation
): Promise<Session> => {
	const sessionID: SessionID = (await promisedRandomBytes(SESSION_ID_BYTE_COUNT)).toString('hex');

	const session: Session = {
		sessionID,
		created: Date.now(),
		userAccount
	};

	await addSessionToDatabase(schema, session);

	return session;
};

export const validateSession = async (schema: Schema, sessionID: SessionID): Promise<Session> => {
	await removeOldSessions(schema);

	const sessions = await getSessionFromID(schema, sessionID);

	if (sessions.length !== 1) {
		throw new Error('Could not find session');
	}

	const session = sessions[0];

	await updateSessionExpireTime(schema, session);

	return session;
};

export type MemberConstructor<T = MemberBase> = new (...args: any[]) => T;

export const SessionedUser = <
	M extends MemberConstructor & {
		Get: (id: any, account: Account, schema: Schema) => Promise<MemberBase>;
	}
>(
	Member: M
) => {
	abstract class User extends Member {
		public static async RestoreFromSession(schema: Schema, account: Account, session: Session) {
			if (session.userAccount.member.type === 'Null') {
				return null;
			}

			let permissions: MemberPermissions;
			try {
				permissions = await getPermissionsForMemberInAccount(schema, session.userAccount.member, account);
			} catch(e) {
				permissions = {
					AddEvent: 0,
					AddTeam: 0,
					AdministerPT: 0,
					AssignPosition: 0,
					AssignTasks: 0,
					CopyEvent: 0,
					CreateNotifications: 0,
					DeleteEvent: 0,
					DownloadCAPWATCH: 0,
					DownloadStaffGuide: 0,
					EditEvent: 0,
					EditTeam: 0,
					EventContactSheet: 0,
					EventLinkList: 0,
					EventStatusPage: 0,
					FlightAssign: 0,
					FileManagement: 0,
					ManageBlog: 0,
					MusterSheet: 0,
					ORMOPORD: 0,
					PTSheet: 0,
					PermissionManagement: 0,
					PromotionManagement: 0,
					ProspectiveMemberManagment: 0,
					RegistryEdit: 0,
					SignUpEdit: 0
				};
			}

			return new User(
				await User.Get(session.userAccount.member.id, account, schema),
				session,
				permissions
			);
		}

		public get sessionID() {
			return this.sessionInformation.sessionID;
		}

		public permissions: MemberPermissions;

		public get username() {
			return this.sessionInformation.userAccount.username;
		}

		public get sessionStarted() {
			return this.sessionInformation.created;
		}

		public get sessionLength() {
			return Date.now() - this.sessionStarted;
		}

		public get userAccount() {
			return this.sessionInformation.userAccount;
		}

		private sessionInformation: Session;

		public constructor(...params: any[]) {
			const [m, s, p] = params as [User, Session, MemberPermissions];
			super(m, m.schema, m.requestingAccount, m.extraInformation);

			this.sessionInformation = s;
			this.permissions = p;
		}

		public hasPermission(permission: MemberPermission, threshold = 1): boolean {
			return this.isRioux || this.permissions[permission] >= threshold;
		}

		public async su(ref: MemberReference) {
			if (!this.isRioux) {
				throw new Error('Cannot su if not Rioux');
			}

			const user = await getInformationForMember(this.schema, ref);

			await su(this.schema, this.sessionID, user);
		}
	}

	return User;
};

export const conditionalMemberMiddleware = asyncErrorHandler(
	async (req: ConditionalMemberRequest, res: Response, next: NextFunction) => {
		if (
			typeof req.headers !== 'undefined' &&
			typeof req.headers.authorization !== 'undefined' &&
			typeof req.account !== 'undefined'
		) {
			let header: string = req.headers.authorization as string;
			if (typeof header !== 'string') {
				header = (header as string[])[0];
			}

			req.member = null;

			let session;
			try {
				session = await validateSession(req.mysqlx, header);
			} catch (e) {
				return next();
			}

			switch (session.userAccount.member.type) {
				case 'CAPNHQMember':
					req.member = (await CAPNHQUser.RestoreFromSession(
						req.mysqlx,
						req.account,
						session
					)) as CAPNHQUser;
					break;

				case 'CAPProspectiveMember':
					req.member = (await CAPProspectiveUser.RestoreFromSession(
						req.mysqlx,
						req.account,
						session
					)) as CAPProspectiveUser;
					break;
			}

			next();
		} else {
			req.member = null;
			next();
		}
	} 
);

export const memberMiddleware = (
	req: ConditionalMemberRequest,
	res: Response,
	next: NextFunction
) =>
	conditionalMemberMiddleware(req, res, () => {
		if (req.member === null) {
			res.status(401);
			res.end();
		} else {
			next();
		}
	});


export const permissionMiddleware = (permission: MemberPermission, threshold = 1) => (
	req: MemberRequest,
	res: Response,
	next: NextFunction
) => {
	if (!req.member) {
		res.status(401);
		return res.end();
	}

	if (!req.member.hasPermission(permission, threshold)) {
		res.status(403);
		return res.end();
	}

	next();
};

export const su = async (
	schema: Schema,
	sessionID: SessionID,
	newUser: UserAccountInformation
) => {
	const sessions = schema.getCollection<Session>(SESSION_TABLE);

	await sessions
		.modify('sessionID = :sessionID')
		.bind({ sessionID })
		.set('userAccount', newUser)
		.execute();
}

//#endregion

//#region Tokens

const TOKEN_BYTE_COUNT = 64;
const TOKEN_AGE = 20 * 1000;
const TOKEN_TABLE = 'Tokens';

interface TokenObject {
	token: string;
	created: number;
	member: UserAccountInformation;
}

const addTokenToDatabase = async (
	schema: Schema,
	token: string,
	member: UserAccountInformation
) => {
	const tokenCollection = schema.getCollection<TokenObject>(TOKEN_TABLE);

	await tokenCollection.add({
		token,
		member,
		created: Date.now()
	});
};

const removeOldTokens = async (schema: Schema) => {
	const tokenCollection = schema.getCollection<TokenObject>(TOKEN_TABLE);

	await tokenCollection
		.remove('created < :created')
		.bind({ created: Date.now() - TOKEN_AGE })
		.execute();
};

const getTokenList = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<TokenObject>(TOKEN_TABLE);

	return await collectResults(findAndBind(tokenCollection, { token }));
};

const invalidateToken = async (schema: Schema, token: string) => {
	const collection = schema.getCollection<TokenObject>('Tokens');

	await collection
		.remove('token = :token')
		.bind({ token })
		.execute();
};

export const getTokenForUser = async (
	schema: Schema,
	user: UserAccountInformation
): Promise<string> => {
	const token = (await randomBytes(TOKEN_BYTE_COUNT)).toString('hex');

	await addTokenToDatabase(schema, token, user);

	return token;
};

export const isTokenValid = async (
	schema: Schema,
	user: MemberReference,
	token: string
): Promise<boolean> => {
	try {
		const member = await getMemberForWeakToken(schema, token);

		return areMemberReferencesTheSame(member.member, user);
	} catch (e) {
		return false;
	}
};

export const getMemberForWeakToken = async (
	schema: Schema,
	token: string
): Promise<UserAccountInformation | null> => {
	await removeOldTokens(schema);

	const tokens = await getTokenList(schema, token);

	if (tokens.length !== 1) {
		throw new Error('Cannot find matching token for member');
	}

	const storedTokenObject = tokens[0];
	const storedToken = storedTokenObject.token;

	await invalidateToken(schema, storedToken);

	if (token !== storedToken) {
		throw new Error('Cannot find matching token for member');
	}

	return storedTokenObject.member;
};

export const tokenMiddleware = async (req: MemberRequest, res: Response, next: NextFunction) => {
	res.status(403);
	res.end();
};

//#endregion

//#region Signin tokens

const SIGNIN_TOKEN_TABLE = 'SigninTokens';

interface SigninTokenObject {
	token: string;
	created: number;
}

const getSigninTokens = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<SigninTokenObject>(SIGNIN_TOKEN_TABLE);

	return collectResults(findAndBind(tokenCollection, { token }));
};

const addSigninTokenToDatabase = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<SigninTokenObject>(SIGNIN_TOKEN_TABLE);

	await tokenCollection.add({
		token,
		created: Date.now()
	});
};

const removeOldSigninTokens = async (schema: Schema) => {
	const tokenCollection = schema.getCollection<SigninTokenObject>(SIGNIN_TOKEN_TABLE);

	await tokenCollection
		.remove('created < :created')
		.bind({ created: Date.now() - TOKEN_AGE })
		.execute();
};

const removeSigninTokens = async (schema: Schema, token: string) => {
	const tokenCollection = schema.getCollection<SigninTokenObject>(SIGNIN_TOKEN_TABLE);

	await tokenCollection
		.remove('token = :token')
		.bind({ token })
		.execute();
};

export const createSigninToken = async (schema: Schema) => {
	const randomToken = (await randomBytes(48)).toString('hex');

	await addSigninTokenToDatabase(schema, randomToken);

	return randomToken;
};

export const isSigninTokenValid = async (schema: Schema, token: string) => {
	await removeOldSigninTokens(schema);

	const results = await getSigninTokens(schema, token);

	await removeSigninTokens(schema, token);

	return results.length === 1;
};

//#endregion

import MemberBase, { areMemberReferencesTheSame } from '../../Members';
import { CAPNHQUser } from '../members/CAPNHQMember';
import { CAPProspectiveUser } from '../members/CAPProspectiveMember';
import { getPermissionsForMemberInAccount, getInformationForMember } from './Account';
