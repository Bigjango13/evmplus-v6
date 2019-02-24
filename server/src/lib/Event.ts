import { Schema } from '@mysql/xdevapi';
import {
	AttendanceRecord,
	DatabaseInterface,
	DebriefItem,
	DisplayInternalPointOfContact,
	EventObject,
	ExternalPointOfContact,
	InternalPointOfContact,
	MemberReference,
	MultCheckboxReturn,
	NewAttendanceRecord,
	NewEventObject,
	RadioReturn
} from 'common-lib';
import { EchelonEventNumber, EventStatus, PointOfContactType } from 'common-lib/index';
import { DateTime } from 'luxon';
import Account from './Account';
import { default as BaseMember, default as MemberBase } from './MemberBase';
import { collectResults, findAndBind } from './MySQLUtil';
import EventValidator from './validator/validators/EventValidator';
import NewAttendanceRecordValidator from './validator/validators/NewAttendanceRecord';

type POCRaw = Array<ExternalPointOfContact | InternalPointOfContact>;
type POCFull = Array<ExternalPointOfContact | DisplayInternalPointOfContact>;

export default class Event implements EventObject, DatabaseInterface<EventObject> {
	public static Validator = new EventValidator();
	public static AttendanceValidator = new NewAttendanceRecordValidator();

	/**
	 * Get an event from the database
	 *
	 * @param id The ID of the event to get
	 * @param account The account to get the event from
	 * @param schema The schema to get the event from
	 */
	public static async Get(id: number | string, account: Account, schema: Schema) {
		if (typeof id === 'string') {
			id = parseInt(id, 10);
		}

		const eventsCollection = schema.getCollection<EventObject>('Events');

		const results = await collectResults(
			findAndBind(eventsCollection, {
				accountID: account.id,
				id
			})
		);

		if (results.length !== 1) {
			throw new Error('There was a problem getting the event');
		}

		results[0].pointsOfContact = await this.ConvertPointsOfContact(
			results[0].pointsOfContact,
			account,
			schema
		);

		return new Event(results[0], account, schema);
	}

	/**
	 *
	 * @param data The new event object to create
	 * @param account The account to create an event for
	 * @param schema The schema to insert the event into
	 */
	public static async Create(
		data: NewEventObject,
		account: Account,
		schema: Schema,
		member: MemberBase
	) {
		const eventsCollection = schema.getCollection<EventObject>('Events');

		const idResults = await collectResults(
			findAndBind(eventsCollection, {
				accountID: account.id
			})
		);

		const newID =
			1 + idResults.map(post => post.id).reduce((prev, curr) => Math.max(prev, curr), 0);

		const timeCreated = +DateTime.utc();

		const pointsOfContact = await this.ConvertPointsOfContact(
			data.pointsOfContact,
			account,
			schema
		);

		const newEvent: EventObject = {
			...data,
			pointsOfContact,
			id: newID,
			accountID: account.id,
			timeCreated,
			timeModified: timeCreated,
			author: member.getReference(),
			attendance: [],
			debrief: [],
			sourceEvent: null
		};

		const results = await eventsCollection.add(newEvent).execute();

		newEvent._id = results.getGeneratedIds()[0];

		return new Event(newEvent, account, schema);
	}

	private static async ConvertPointsOfContact(
		pocs: POCRaw,
		account: Account,
		schema: Schema
	): Promise<POCFull> {
		const internalPointsOfContact = pocs.filter(
			p => p.type === PointOfContactType.INTERNAL
		) as InternalPointOfContact[];

		const members = await Promise.all(
			internalPointsOfContact.map(p =>
				MemberBase.ResolveReference(p.memberReference, account, schema)
			)
		);

		const newPOCs = pocs as POCFull;

		newPOCs.forEach(poc => {
			if (poc.type === PointOfContactType.INTERNAL) {
				for (const mem of members) {
					if (mem.matchesReference(poc.memberReference)) {
						poc.name = mem.getFullName();
					}
				}
			}
		});

		return newPOCs;
	}

	private static DownconvertPointsOfContact(pocs: POCFull): POCRaw {
		const newPOCs = pocs as POCRaw;

		newPOCs.forEach((poc, i) => {
			if (poc.type === PointOfContactType.INTERNAL) {
				newPOCs[i] = {
					email: poc.email,
					memberReference: poc.memberReference,
					phone: poc.phone,
					receiveEventUpdates: poc.receiveEventUpdates,
					receiveRoster: poc.receiveRoster,
					receiveSignUpUpdates: poc.receiveSignUpUpdates,
					receiveUpdates: poc.receiveUpdates,
					type: PointOfContactType.INTERNAL
				};
			}
		});

		return newPOCs;
	}

	public id: number;

	public accountID: string;

	public timeCreated: number;

	public timeModified: number;

	public name: string;

	public meetDateTime: number;

	public meetLocation: string;

	public startDateTime: number;

	public location: string;

	public endDateTime: number;

	public pickupDateTime: number;

	public pickupLocation: string;

	public transportationProvided: boolean;

	public transportationDescription: string;

	public uniform: MultCheckboxReturn;

	public desiredNumberOfParticipants: number;

	public registration: null | {
		deadline: number;
		information: string;
	};

	public participationFee: null | {
		feeDue: number;
		feeAmount: number;
	};

	public mealsDescription: MultCheckboxReturn;

	public lodgingArrangments: MultCheckboxReturn;

	public activity: MultCheckboxReturn;

	public highAdventureDescription: string;

	public requiredEquipment: string[];

	public eventWebsite: string;

	public requiredForms: MultCheckboxReturn;

	public comments: string;

	public acceptSignups: boolean;

	public signUpDenyMessage: string;

	public publishToWingCalendar: boolean;

	public showUpcoming: boolean;

	public groupEventNumber: RadioReturn<EchelonEventNumber>;

	public wingEventNumber: RadioReturn<EchelonEventNumber>;

	public regionEventNumber: RadioReturn<EchelonEventNumber>;

	public complete: boolean;

	public administrationComments: string;

	public status: EventStatus;

	public debrief: DebriefItem[];

	public pointsOfContact: Array<DisplayInternalPointOfContact | ExternalPointOfContact>;

	public author: MemberReference;

	public signUpPartTime: boolean;

	public teamID: number;

	public limitSignupsToTeam: boolean | null;

	public sourceEvent: null | {
		id: number;
		accountID: string;
	};

	public fileIDs: string[];

	public attendance: AttendanceRecord[];

	// Documents require it
	// tslint:disable-next-line:variable-name
	public _id: string;

	/**
	 * Constructs an event object given the event data
	 *
	 * @param data The event object
	 * @param account The account for the event
	 * @param schema The schema for the event
	 */
	private constructor(data: EventObject, private account: Account, private schema: Schema) {
		Object.assign(this, data);

		this.attendance = data.attendance;
	}

	/**
	 * Saves the event to the database
	 *
	 * @param {Account} account The account to save it to. If not provided,
	 * 		it uses the account ID the object was created with
	 */
	public async save(account: Account = this.account) {
		const timeModified = +DateTime.utc();

		const eventsCollection = this.schema.getCollection<EventObject>('Events');

		const pointsOfContact = Event.DownconvertPointsOfContact(this.pointsOfContact);

		await eventsCollection.replaceOne(this._id, {
			...this.toFullRaw(),
			timeModified,
			accountID: account.id,
			pointsOfContact: pointsOfContact as Array<
				DisplayInternalPointOfContact | ExternalPointOfContact
			>
		});
	}

	/**
	 * Remove the event from the database
	 */
	public async remove() {
		const eventsCollection = this.schema.getCollection<EventObject>('Events');

		await eventsCollection
			.remove('accountID = :accountID AND id = :id')
			.bind({
				accountID: this.account.id,
				id: this.id
			})
			.execute();
	}

	/**
	 * Checks if the member is a POC of the current event
	 *
	 * @param member The member to check
	 */
	public isPOC(member: BaseMember) {
		return (
			!!this.pointsOfContact.map(
				poc =>
					poc.type === PointOfContactType.INTERNAL &&
					MemberBase.AreMemberReferencesTheSame(
						member.getReference(),
						poc.memberReference
					)
			) ||
			member.matchesReference(this.author) ||
			member.isRioux
		);
	}

	/**
	 * Copies the event in such a way as to preserve all information except time,
	 * 	which is modified to preserve the deltas but start at the specified date time
	 *
	 * @param newStartTime The start time of the new event
	 */
	public copy(
		newStartTime: DateTime,
		member: MemberBase,
		copyStatus = false,
		copyFiles = true
	): Promise<Event> {
		const timeDelta = +newStartTime - this.startDateTime;

		const newEvent: NewEventObject = {
			acceptSignups: this.acceptSignups,
			activity: this.activity,
			administrationComments: this.administrationComments,
			comments: this.comments,
			complete: this.complete,
			desiredNumberOfParticipants: this.desiredNumberOfParticipants,
			eventWebsite: this.eventWebsite,
			groupEventNumber: this.groupEventNumber,
			highAdventureDescription: this.highAdventureDescription,
			location: this.location,
			lodgingArrangments: this.lodgingArrangments,
			mealsDescription: this.mealsDescription,
			meetLocation: this.meetLocation,
			name: this.name,
			participationFee: this.participationFee,
			pickupLocation: this.pickupLocation,
			pointsOfContact: this.pointsOfContact,
			publishToWingCalendar: this.publishToWingCalendar,
			regionEventNumber: this.regionEventNumber,
			registration: this.registration,
			requiredEquipment: this.requiredEquipment,
			showUpcoming: this.showUpcoming,
			signUpDenyMessage: this.signUpDenyMessage,
			signUpPartTime: this.signUpPartTime,
			requiredForms: this.requiredForms,
			fileIDs: copyFiles ? this.fileIDs : [],
			status: copyStatus ? this.status : EventStatus.INFORMATIONONLY,
			teamID: this.teamID,
			limitSignupsToTeam: this.limitSignupsToTeam,
			transportationDescription: this.transportationDescription,
			transportationProvided: this.transportationProvided,
			uniform: this.uniform,
			wingEventNumber: this.wingEventNumber,

			meetDateTime: this.meetDateTime + timeDelta,
			startDateTime: this.startDateTime + timeDelta,
			endDateTime: this.endDateTime + timeDelta,
			pickupDateTime: this.pickupDateTime + timeDelta
		};

		return Event.Create(newEvent, this.account, this.schema, member);
	}

	/**
	 * Links the event to another account
	 *
	 * @param targetAccount The account to link to
	 * @param member The member linking the event
	 */
	public async linkTo(targetAccount: Account, member: MemberBase): Promise<Event> {
		const linkedEvent = await Event.Create(this.toRaw(), targetAccount, this.schema, member);

		linkedEvent.sourceEvent = {
			accountID: this.account.id,
			id: this.id
		};

		await linkedEvent.save();

		return linkedEvent;
	}

	/**
	 * Deletes the current event
	 */
	public async delete(): Promise<void> {
		const eventsCollection = this.schema.getCollection<EventObject>('Events');

		await eventsCollection.removeOne(this._id);
	}

	/**
	 * Updates the values in a secure manner
	 *
	 * @param values The values to set
	 */
	public set(values: Partial<NewEventObject>): boolean {
		if (Event.Validator.validate(values, true)) {
			Event.Validator.partialPrune(values, this);

			return true;
		} else {
			throw new Error(Event.Validator.getErrorString());
		}
	}

	/**
	 * Converts the current event to a transferable object
	 */
	public toRaw = (member?: MemberBase): EventObject => ({
		id: this.id,
		accountID: this.accountID,
		acceptSignups: this.acceptSignups,
		activity: this.activity,
		administrationComments: this.administrationComments,
		author: this.author,
		comments: this.comments,
		complete: this.complete,
		debrief: this.debrief,
		desiredNumberOfParticipants: this.desiredNumberOfParticipants,
		endDateTime: this.endDateTime,
		eventWebsite: this.eventWebsite,
		groupEventNumber: this.groupEventNumber,
		highAdventureDescription: this.highAdventureDescription,
		location: this.location,
		lodgingArrangments: this.lodgingArrangments,
		mealsDescription: this.mealsDescription,
		meetDateTime: this.meetDateTime,
		meetLocation: this.meetLocation,
		name: this.name,
		participationFee: !!this.participationFee ? this.participationFee : null,
		pickupDateTime: this.pickupDateTime,
		pickupLocation: this.pickupLocation,
		pointsOfContact: this.pointsOfContact,
		publishToWingCalendar: this.publishToWingCalendar,
		regionEventNumber: this.regionEventNumber,
		registration: !!this.registration ? this.registration : null,
		requiredEquipment: this.requiredEquipment,
		requiredForms: this.requiredForms,
		showUpcoming: this.showUpcoming,
		signUpDenyMessage: !!this.signUpDenyMessage ? this.signUpDenyMessage : null,
		signUpPartTime: !!this.signUpPartTime,
		sourceEvent: !!this.sourceEvent ? this.sourceEvent : null,
		startDateTime: this.startDateTime,
		status: this.status,
		teamID: this.teamID,
		limitSignupsToTeam: this.teamID !== null ? this.limitSignupsToTeam : null,
		timeCreated: this.timeCreated,
		timeModified: this.timeModified,
		transportationDescription: this.transportationDescription,
		transportationProvided: this.transportationProvided,
		uniform: this.uniform,
		wingEventNumber: this.wingEventNumber,
		fileIDs: this.fileIDs,
		attendance: member === null || member === undefined ? [] : this.getAttendance()
	});

	/**
	 * toRaw conditionally provides the attendance based on parameters
	 *
	 * This method returns the full, raw object unconditionally
	 */
	public toFullRaw = (): EventObject => ({
		...this.toRaw(),
		attendance: this.getAttendance(),
		limitSignupsToTeam: this.limitSignupsToTeam
	});

	public async getSourceEvent(): Promise<Event> {
		if (this.sourceEvent === null) {
			return Promise.reject('There is no source event');
		}

		const sourceAccount = await Account.Get(this.sourceEvent.accountID, this.schema);

		return Event.Get(this.sourceEvent.id, sourceAccount, this.schema);
	}

	// ----------------------------------------------------
	// 					Attendance code
	// ----------------------------------------------------

	/**
	 * Returns the attendance for the event
	 */
	public getAttendance = (): AttendanceRecord[] => this.attendance.slice();

	/**
	 * Add member to attendance
	 *
	 * @param newAttendanceRecord The record to add. Contains partial details
	 * @param member The member to add to the records
	 */
	public addMemberToAttendance = (
		newAttendanceRecord: NewAttendanceRecord,
		member: BaseMember
	): AttendanceRecord[] =>
		(this.attendance = [
			...this.attendance,
			{
				comments: newAttendanceRecord.comments,
				memberID: member.getReference(),
				memberName: member.getFullName(),
				planToUseCAPTransportation: newAttendanceRecord.planToUseCAPTransportation,
				status: newAttendanceRecord.status,
				summaryEmailSent: false,
				timestamp: +DateTime.utc(),
				canUsePhotos: newAttendanceRecord.canUsePhotos,

				// If these are null, they are staying for the whole event
				arrivalTime: newAttendanceRecord.arrivalTime,
				departureTime: newAttendanceRecord.departureTime
			}
		]);

	/**
	 * Modifies a current attendance record
	 *
	 * @param newAttendanceRecord The record to set
	 * @param member The member to modify for
	 */
	public modifyAttendanceRecord = (
		newAttendanceRecord: NewAttendanceRecord,
		member: BaseMember
	): AttendanceRecord[] =>
		(this.attendance = this.attendance.map(record =>
			member.matchesReference(record.memberID)
				? {
						comments: newAttendanceRecord.comments,
						memberID: member.getReference(),
						memberName: member.getFullName(),
						planToUseCAPTransportation: newAttendanceRecord.planToUseCAPTransportation,
						status: newAttendanceRecord.status,
						summaryEmailSent: false,
						timestamp: +DateTime.utc(),
						canUsePhotos: newAttendanceRecord.canUsePhotos,

						// If these are undefined, they are staying for the whole event
						arrivalTime: newAttendanceRecord.arrivalTime,
						departureTime: newAttendanceRecord.departureTime
				  }
				: record
		));

	public removeMemberFromAttendance = (member: BaseMember): AttendanceRecord[] =>
		(this.attendance = this.attendance.filter(
			record => !member.matchesReference(record.memberID)
		));

	// ----------------------------------------------------
	// 					Debrief code
	// ----------------------------------------------------

	/**
	 * Returns the debriefs for the event
	 */
	public getDebriefs = (): DebriefItem[] => this.debrief.slice();

	/**
	 * Add item to debrief
	 *
	 * @param newDebriefItem The text of the record to add
	 * @param member The member to add to the records
	 */
	public addItemToDebrief = (newDebriefItem: string, member: BaseMember): DebriefItem[] =>
		(this.debrief = [
			...this.debrief,
			{
				memberRef: member.getReference(),
				timeSubmitted: +DateTime.utc(),
				debriefText: newDebriefItem
			}
		]);

	/**
	 * Removes a debrief item
	 *
	 * @param member The member who submitted the debrief item
	 * @param timeSubmitted The time the member submitted it
	 */
	public removeItemFromDebrief = (member: BaseMember, timeOfRecord: number): DebriefItem[] =>
		(this.debrief = this.debrief.filter(
			record =>
				!(
					member.matchesReference(record.memberRef) &&
					timeOfRecord === record.timeSubmitted
				)
		));
}
export { EventStatus };
