/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Collection, Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	always,
	areMembersTheSame,
	AsyncEither,
	AsyncIter,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	AttendanceRecord,
	canSignUpForEvent,
	collectGeneratorAsync,
	ServerConfiguration,
	destroy,
	DisplayInternalPointOfContact,
	Either,
	errorGenerator,
	EventObject,
	EventStatus,
	ExternalPointOfContact,
	get,
	getItemsNotInSecondArray,
	InternalPointOfContact,
	isPOCOf,
	Maybe,
	MaybeObj,
	MemberReference,
	NewAttendanceRecord,
	NewEventObject,
	NotificationCauseType,
	NotificationDataType,
	NotificationTargetType,
	PointOfContact,
	PointOfContactType,
	RawEventObject,
	ServerError,
	stripProp,
	toReference,
	Member,
	getFullMemberName,
	asyncIterConcat,
	asyncIterFlatMap,
	identity,
	asyncIterFilter,
	Right,
	EitherObj,
	call,
} from 'common-lib';
import { getAccount } from './Account';
import updateGoogleCalendars, {
	createGoogleCalendarEvents,
	removeGoogleCalendarEvents,
} from './GoogleUtils';
import { getMemberName } from './Members';
import {
	addToCollection,
	collectResults,
	deleteItemFromCollectionA,
	findAndBindC,
	generateFindStatement,
	generateResults,
	getNewID,
	modifyAndBindC,
	saveToCollectionA,
	generateBindObject,
	findAndBind,
} from './MySQLUtil';
import { createNotification } from './Notification';
import { ServerEither } from './servertypes';
import { getTeam } from './Team';

type POCRaw = (ExternalPointOfContact | InternalPointOfContact)[];
type POCFull = (ExternalPointOfContact | DisplayInternalPointOfContact)[];

export interface RawAttendanceDBRecord
	extends Omit<AttendanceRecord, 'sourceAccountID' | 'sourceEventID'> {
	accountID: string;
	eventID: number;
}

export { EventStatus };

export const getFullPointsOfContact = (schema: Schema) => (account: AccountObject) => (
	records: POCRaw,
): ServerEither<POCFull> =>
	AsyncEither.All(
		records.map<ServerEither<DisplayInternalPointOfContact | ExternalPointOfContact>>(poc =>
			poc.type === PointOfContactType.INTERNAL
				? getMemberName(schema)(account)(poc.memberReference).map(name => ({
						...poc,
						name,
				  }))
				: asyncRight(poc, errorGenerator('Could not get point of contact data')),
		),
	);

export const getSimplePointsOfContact = (
	records: (ExternalPointOfContact | InternalPointOfContact | DisplayInternalPointOfContact)[],
): POCRaw =>
	records.map(poc =>
		poc.type === PointOfContactType.EXTERNAL
			? poc
			: {
					type: PointOfContactType.INTERNAL,
					email: poc.email,
					memberReference: poc.memberReference,
					phone: poc.phone,
					receiveEventUpdates: poc.receiveEventUpdates,
					receiveRoster: poc.receiveRoster,
					receiveSignUpUpdates: poc.receiveSignUpUpdates,
					receiveUpdates: poc.receiveUpdates,
			  },
	);

export const attendanceRecordMapper = (rec: RawAttendanceDBRecord): AttendanceRecord => ({
	comments: rec.comments,
	customAttendanceFieldValues: rec.customAttendanceFieldValues,
	memberID: rec.memberID,
	memberName: rec.memberName,
	planToUseCAPTransportation: rec.planToUseCAPTransportation,
	status: rec.status,
	summaryEmailSent: rec.summaryEmailSent,
	timestamp: rec.timestamp,
	shiftTime: rec.shiftTime,
	sourceAccountID: rec.accountID,
	sourceEventID: rec.eventID,
});

export const attendanceRecordIterMapper = asyncIterMap(attendanceRecordMapper);

const findForMemberFunc = (now = Date.now) => ({ id: accountID }: AccountObject) => (
	member: MemberReference,
) => (collection: Collection<RawAttendanceDBRecord>) =>
	collection
		.find(
			'memberID.id = :member_id AND memberID.type = :member_type AND accountID = :accountID AND shiftTime.departureTime < :endDateTime',
		)
		// @ts-ignore
		.bind('member_id', member.id)
		// @ts-ignore
		.bind('member_type', member.type)
		.bind('accountID', accountID)
		// @ts-ignore
		.bind('endDateTime', now());

export const getLatestAttendanceForMemberFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (member: MemberReference): ServerEither<MaybeObj<RawAttendanceDBRecord>> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findForMemberFunc(now)(account)(member))
		.map(find => find.limit(1).sort('shiftTime.departureTime DESC'))
		.map(collectResults)
		.map(Maybe.fromArray);
export const getLatestAttendanceForMember = getLatestAttendanceForMemberFunc(Date.now);

export const getAttendanceForMemberFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (member: MemberReference) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(findForMemberFunc(now)(account)(member))
		.map<AsyncIter<RawAttendanceDBRecord>>(generateResults);
export const getAttendanceForMember = getAttendanceForMemberFunc(Date.now);

const getLinkedEvents = (schema: Schema) => (accountID: string) => (eventID: number) =>
	generateResults(
		findAndBind(schema.getCollection<RawEventObject>('Events'), {
			sourceEvent: { id: eventID, accountID },
		}),
	);

const getLinkedEventsAttendance = (schema: Schema) => (accountID: string) => (
	eventID: number,
): AsyncIter<AttendanceRecord> =>
	asyncIterFlatMap(identity)(
		asyncIterMap<
			Right<AsyncIterableIterator<AttendanceRecord>>,
			AsyncIterableIterator<AttendanceRecord>
		>(get('value'))(
			asyncIterFilter<
				EitherObj<ServerError, AsyncIterableIterator<AttendanceRecord>>,
				Right<AsyncIterableIterator<AttendanceRecord>>
			>(Either.isRight)(
				asyncIterMap(getAttendanceForEvent(schema))(
					getLinkedEvents(schema)(accountID)(eventID),
				),
			),
		),
	);

export const getAttendanceForEvent = (schema: Schema) => ({
	id: eventID,
	accountID,
}: RawEventObject) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(
			findAndBindC<RawAttendanceDBRecord>({ eventID, accountID }),
		)
		.map(generateResults)
		.map(attendanceRecordIterMapper)
		.map(iter =>
			asyncIterConcat(iter)(() => getLinkedEventsAttendance(schema)(accountID)(eventID)),
		);

export const getEventAttendance = (schema: Schema) => (account: AccountObject) => (
	eventID: number,
): ServerEither<AsyncIter<AttendanceRecord>> =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not get attendance records'),
	)
		.map(
			findAndBindC<RawAttendanceDBRecord>({ eventID, accountID: account.id }),
		)
		.map(generateResults)
		.map(attendanceRecordIterMapper)
		.map(iter =>
			asyncIterConcat(iter)(() => getLinkedEventsAttendance(schema)(account.id)(eventID)),
		);

export const getFullEventObject = (schema: Schema) => (account: AccountObject) => (
	viewer: MaybeObj<MemberReference>,
) => (event: RawEventObject): ServerEither<EventObject> =>
	(Maybe.isSome(viewer)
		? getFullPointsOfContact(schema)(account)(event.pointsOfContact)
		: asyncRight<ServerError, POCFull>([], {
				type: 'OTHER',
				code: 500,
				message: 'Could not get points of contact',
		  })
	).flatMap(pointsOfContact =>
		viewer.hasValue && (!event.privateAttendance || isPOCOf(viewer.value, event))
			? getAttendanceForEvent(schema)(event)
					.map(collectGeneratorAsync)
					.map<EventObject>(attendance => ({
						...event,
						pointsOfContact,
						attendance,
					}))
			: asyncRight<ServerError, EventObject>(
					{
						...event,
						pointsOfContact,
						attendance: [] as AttendanceRecord[],
					},
					errorGenerator('Could not get event with attendance'),
			  ),
	);

export const removeMemberFromEventAttendance = (schema: Schema) => (account: AccountObject) => (
	event: RawEventObject,
) => (member: MemberReference) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not delete attendance record'),
	)
		.map(collection =>
			collection
				.remove(
					generateFindStatement({
						accountID: account.id,
						eventID: event.id,
						memberID: toReference(member),
					}),
				)
				.bind(
					generateBindObject({
						accountID: account.id,
						eventID: event.id,
						memberID: toReference(member),
					}),
				)
				.execute(),
		)
		.map(destroy);

const sendSignupDenyMessage = (message: string): ServerEither<void> =>
	asyncLeft({
		type: 'OTHER',
		code: 400,
		message,
	});

export const addMemberToAttendanceFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (event: EventObject) => (attendee: Required<NewAttendanceRecord>) =>
	(event.teamID !== null && event.teamID !== undefined
		? getTeam(schema)(account)(event.teamID).map(Maybe.some)
		: asyncRight(Maybe.none(), errorGenerator('Could not get team information'))
	)
		.map(canSignUpForEvent(event))
		.map(call(attendee.memberID))
		.map(
			Either.cata<string, void, ServerEither<void>>(sendSignupDenyMessage)(() =>
				asyncRight(void 0, errorGenerator('Could not add member to attendance')),
			),
		)
		.flatMap(() =>
			getMemberName(schema)(account)(attendee.memberID).flatMap(memberName =>
				addToCollection(schema.getCollection<RawAttendanceDBRecord>('Attendance'))({
					...attendee,
					accountID: event.accountID,
					eventID: event.id,
					timestamp: now(),
					memberName,
					summaryEmailSent: false,
					shiftTime: attendee.shiftTime ?? {
						arrivalTime: event.meetDateTime,
						departureTime: event.pickupDateTime,
					},
				}),
			),
		);
export const addMemberToAttendance = addMemberToAttendanceFunc(Date.now);

export const modifyEventAttendanceRecord = (schema: Schema) => (account: AccountObject) => (
	event: RawEventObject,
) => (member: Member) => (record: Omit<Partial<NewAttendanceRecord>, 'memberID'>) =>
	asyncRight(
		schema.getCollection<RawAttendanceDBRecord>('Attendance'),
		errorGenerator('Could not save attendance record'),
	)
		.map(
			modifyAndBindC<RawAttendanceDBRecord>({
				accountID: account.id,
				eventID: event.id,
				memberID: toReference(member),
			}),
		)
		.map(collection =>
			collection
				.patch({
					...record,
					memberID: toReference(member),
					memberName: getFullMemberName(member),
					shiftTime: record.shiftTime ?? {
						arrivalTime: event.meetDateTime,
						departureTime: event.pickupDateTime,
					},
				})
				.execute(),
		)
		.map(destroy);

export const getSourceEvent = (schema: Schema) => (
	event: RawEventObject,
): ServerEither<MaybeObj<RawEventObject>> =>
	event.sourceEvent
		? getAccount(schema)(event.sourceEvent.accountID)
				.flatMap(account => getEvent(schema)(account)(event.sourceEvent!.id))
				.map(Maybe.some)
		: asyncRight(Maybe.none(), errorGenerator('Could not get source event'));

export const getEvent = (schema: Schema) => (account: AccountObject) => (
	eventID: number | string,
): ServerEither<RawEventObject> =>
	asyncRight(parseInt(eventID + '', 10), errorGenerator('There was a problem getting the event'))
		.filter(id => !isNaN(id), {
			type: 'OTHER',
			code: 400,
			message: 'Invalid event ID',
		})
		.flatMap(id =>
			asyncRight(
				schema.getCollection<RawEventObject>('Events'),
				errorGenerator('Could not get event'),
			)
				.map(
					findAndBindC<RawEventObject>({
						accountID: account.id,
						id,
					}),
				)
				.map(collectResults),
		)
		.filter(results => results.length === 1, {
			type: 'OTHER',
			code: 404,
			message: 'Could not find event specified',
		})
		.map(get(0))
		.map(stripProp('_id'));

const sendPOCNotifications = (delta: 'ADDED' | 'REMOVED') => (schema: Schema) => (
	account: AccountObject,
) => (event: RawEventObject) => (pocs: InternalPointOfContact[]) =>
	AsyncEither.All(
		pocs.map(poc =>
			createNotification(schema)(account)({
				target: {
					type: NotificationTargetType.MEMBER,
					to: poc.memberReference,
				},
				cause: {
					type: NotificationCauseType.SYSTEM,
				},
				extraData: {
					accountID: event.accountID,
					delta,
					eventID: event.id,
					eventName: event.name,
					type: NotificationDataType.EVENT,
				},
			}),
		),
	).map(destroy);

const sendPOCRemovedNotifications = sendPOCNotifications('REMOVED');
const sendPOCAddedNotifications = sendPOCNotifications('ADDED');

export const saveEventFunc = (now = Date.now) => (config: ServerConfiguration) => (
	schema: Schema,
) => (account: AccountObject) => (oldEvent: RawEventObject) => (event: RawEventObject) =>
	asyncRight(
		updateGoogleCalendars(schema, event, account, config),
		errorGenerator('Could not update google calendar'),
	)
		.map<RawEventObject>(([mainId, regId, feeId]) => ({
			acceptSignups: event.acceptSignups,
			accountID: event.accountID,
			activity: event.activity,
			administrationComments: event.administrationComments,
			author: event.author,
			comments: event.comments,
			complete: event.complete,
			customAttendanceFields: event.customAttendanceFields,
			debrief: event.debrief,
			desiredNumberOfParticipants: event.desiredNumberOfParticipants,
			endDateTime: event.endDateTime,
			eventWebsite: event.eventWebsite,
			fileIDs: event.fileIDs,
			googleCalendarIds: {
				mainId,
				regId,
				feeId,
			},
			groupEventNumber: event.groupEventNumber,
			highAdventureDescription: event.highAdventureDescription,
			id: event.id,
			limitSignupsToTeam: event.limitSignupsToTeam,
			location: event.location,
			lodgingArrangments: event.lodgingArrangments,
			mealsDescription: event.mealsDescription,
			meetDateTime: event.meetDateTime,
			meetLocation: event.meetLocation,
			name: event.name,
			participationFee: event.participationFee,
			pickupDateTime: event.pickupDateTime,
			pickupLocation: event.pickupLocation,
			pointsOfContact: getSimplePointsOfContact(event.pointsOfContact),
			privateAttendance: event.privateAttendance,
			regionEventNumber: event.regionEventNumber,
			registration: event.registration,
			requiredEquipment: event.requiredEquipment,
			requiredForms: event.requiredForms,
			showUpcoming: event.showUpcoming,
			signUpDenyMessage: event.signUpDenyMessage,
			signUpPartTime: event.signUpPartTime,
			sourceEvent: event.sourceEvent,
			startDateTime: event.startDateTime,
			status: event.status,
			teamID: event.teamID,
			timeCreated: event.timeCreated,
			timeModified: now(),
			transportationDescription: event.transportationDescription,
			transportationProvided: event.transportationProvided,
			uniform: event.uniform,
		}))
		.flatMap(newEvent => {
			const isInternalPOC = (poc: PointOfContact): poc is InternalPointOfContact =>
				poc.type === PointOfContactType.INTERNAL;
			const oldInternalPOCs = oldEvent.pointsOfContact.filter(isInternalPOC);
			const newInternalPOCs = newEvent.pointsOfContact.filter(isInternalPOC);

			const pocGetter = getItemsNotInSecondArray<InternalPointOfContact>(item1 => item2 =>
				areMembersTheSame(item1.memberReference)(item2.memberReference),
			);

			const removedPOCs = pocGetter(oldInternalPOCs)(newInternalPOCs);
			const addedPOCs = pocGetter(newInternalPOCs)(oldInternalPOCs);

			return AsyncEither.All([
				sendPOCRemovedNotifications(schema)(account)(newEvent)(removedPOCs),
				sendPOCAddedNotifications(schema)(account)(newEvent)(addedPOCs),
			]).map(always(newEvent));
		})
		.flatMap(saveToCollectionA(schema.getCollection<RawEventObject>('Events')));

export const saveEvent = saveEventFunc();

export const removeItemFromEventDebrief = (event: RawEventObject) => (timeToRemove: number) => ({
	...event,
	debrief: event.debrief.filter(({ timeSubmitted }) => timeSubmitted !== timeToRemove),
});

export const deleteEvent = (config: ServerConfiguration) => (schema: Schema) => (
	account: AccountObject,
) => (event: RawEventObject): ServerEither<void> =>
	asyncRight(
		removeGoogleCalendarEvents(event, account, config),
		errorGenerator('Could not delete Google calendar events'),
	)
		.map(always(event))
		.flatMap(deleteItemFromCollectionA(schema.getCollection<RawEventObject>('Events')));

export const createEventFunc = (now = Date.now) => (config: ServerConfiguration) => (
	schema: Schema,
) => (account: AccountObject) => (author: MemberReference) => (data: NewEventObject) =>
	getNewID(account)(schema.getCollection<RawEventObject>('Events'))
		.map<RawEventObject>(id => ({
			acceptSignups: data.acceptSignups,
			activity: data.activity,
			administrationComments: data.administrationComments,
			comments: data.comments,
			complete: data.complete,
			customAttendanceFields: data.customAttendanceFields,
			desiredNumberOfParticipants: data.desiredNumberOfParticipants,
			endDateTime: data.endDateTime,
			eventWebsite: data.eventWebsite,
			fileIDs: data.fileIDs,
			groupEventNumber: data.groupEventNumber,
			highAdventureDescription: data.highAdventureDescription,
			limitSignupsToTeam: data.limitSignupsToTeam,
			location: data.location,
			lodgingArrangments: data.lodgingArrangments,
			mealsDescription: data.mealsDescription,
			meetDateTime: data.meetDateTime,
			meetLocation: data.meetLocation,
			name: data.name,
			participationFee: data.participationFee,
			pickupDateTime: data.pickupDateTime,
			pickupLocation: data.pickupLocation,
			pointsOfContact: data.pointsOfContact,
			privateAttendance: data.privateAttendance,
			regionEventNumber: data.regionEventNumber,
			registration: data.registration,
			requiredEquipment: data.requiredEquipment,
			requiredForms: data.requiredForms,
			showUpcoming: data.showUpcoming,
			signUpDenyMessage: data.signUpDenyMessage,
			signUpPartTime: data.signUpPartTime,
			startDateTime: data.startDateTime,
			status: data.status,
			teamID: data.teamID,
			transportationDescription: data.transportationDescription,
			transportationProvided: data.transportationProvided,
			uniform: data.uniform,

			id,
			accountID: account.id,
			author,
			timeCreated: now(),
			timeModified: now(),
			debrief: [],
			googleCalendarIds: {},
		}))
		.flatMap(event =>
			asyncRight(
				createGoogleCalendarEvents(schema, event, account, config),
				errorGenerator('Could not create Google calendar events'),
			).map<RawEventObject>(([mainId, regId, feeId]) => ({
				...event,
				googleCalendarIds: {
					mainId,
					regId,
					feeId,
				},
			})),
		)
		.flatMap(addToCollection(schema.getCollection<RawEventObject>('Events')));
export const createEvent = createEventFunc(Date.now);

export const copyEventFunc = (now = Date.now) => (config: ServerConfiguration) => (
	schema: Schema,
) => (account: AccountObject) => (event: RawEventObject) => (author: MemberReference) => (
	newStartTime: number,
) => (copyStatus = false) => (copyFiles = false) =>
	asyncRight(newStartTime - event.startDateTime, errorGenerator('Could not copy event'))
		.map(timeDelta => ({
			...event,

			fileIDs: copyFiles ? event.fileIDs : [],
			status: copyStatus ? event.status : EventStatus.INFORMATIONONLY,

			meetDateTime: event.meetDateTime + timeDelta,
			startDateTime: event.startDateTime + timeDelta,
			endDateTime: event.endDateTime + timeDelta,
			pickupDateTime: event.pickupDateTime + timeDelta,
		}))
		.flatMap(createEventFunc(now)(config)(schema)(account)(author));
export const copyEvent = copyEventFunc(Date.now);

export const linkEventFunc = (now = Date.now) => (config: ServerConfiguration) => (
	schema: Schema,
) => (account: AccountObject) => (linkedEvent: RawEventObject) => (author: MemberReference) => (
	targetAccount: AccountObject,
) =>
	asyncRight(linkedEvent, errorGenerator('Could not link event'))
		.filter(event => !event.sourceEvent, {
			type: 'OTHER',
			code: 400,
			message: 'Cannot link to a linked event',
		})
		.flatMap(createEventFunc(now)(config)(schema)(targetAccount)(author))
		.map<RawEventObject>(event => ({
			...event,
			sourceEvent: {
				accountID: account.id,
				id: linkedEvent.id,
			},
		}))
		.flatMap(event => saveEventFunc(now)(config)(schema)(targetAccount)(event)(event));
export const linkEvent = linkEventFunc();
