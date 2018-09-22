import { Schema } from '@mysql/xdevapi';
import { DateTime } from 'luxon';
import { EventStatus, PointOfContactType } from '../enums';
import Account from './Account';
import { default as BaseMember, default as MemberBase } from './MemberBase';
import { collectResults, findAndBind } from './MySQLUtil';

export default class Event
	implements EventObject, DatabaseInterface<EventObject> {
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
			1 +
			idResults
				.map(post => post.id)
				.reduce((prev, curr) => Math.max(prev, curr), 0);

		const timeCreated = Math.round(+DateTime.utc() / 1000);

		const newEvent: EventObject = {
			...data,
			id: newID,
			accountID: account.id,
			timeCreated,
			timeModified: timeCreated,
			author: member.id,
			attendance: []
		};

		const results = await eventsCollection.add(newEvent).execute();

		newEvent._id = results.getGeneratedIds()[0];

		return new Event(newEvent, account, schema);
	}

	public id: number = 0;

	public accountID: string = '';

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

	public registration?: {
		deadline: number;
		information: string;
	};

	public participationFee?: {
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

	public groupEventNumber: [number, string];

	public wingEventNumber: number;

	public complete: boolean;

	public administrationComments: string;

	public status: EventStatus;

	public debrief: string;

	public pointsOfContact: Array<
		InternalPointOfContact | ExternalPointOfContact
	>;

	public author: number;

	public signUpPartTime: boolean;

	public teamID: number;

	public sourceEvent?: {
		id: number;
		accountID: string;
	};

	public fileIDs: string[];

	public attendance: AttendanceRecord[] = [];

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
	private constructor(
		data: EventObject,
		private account: Account,
		private schema: Schema
	) {
		Object.assign(this, data);
	}

	/**
	 * Saves the event to the database
	 *
	 * @param {Account} account The account to save it to. If not provided,
	 * 		it uses the account ID the object was created with
	 */
	public async save(account: Account = this.account) {
		const timeModified = +DateTime.utc();

		const eventsCollection = this.schema.getCollection<EventObject>(
			'Events'
		);

		await eventsCollection.replaceOne(this._id, {
			...this.toFullRaw(),
			timeModified,
			accountID: account.id
		});
	}

	/**
	 * Save a copy of the event to database
	 *
	 * @param {Account} account The account to save to
	 */
	public async saveCopy(account: Account) {
		const timeCreated = +DateTime.utc();

		const eventsCollection = this.schema.getCollection<EventObject>(
			'Events'
		);

		await eventsCollection.add({
			...this.toRaw(),
			timeCreated,
			timeModified: timeCreated,
			accountID: account.id
		});
	}

	/**
	 * Remove the event from the database
	 */
	public async remove() {
		const eventsCollection = this.schema.getCollection<EventObject>(
			'Events'
		);

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
			this.pointsOfContact.map(
				poc =>
					poc.type === PointOfContactType.INTERNAL &&
					poc.id === member.id
			) ||
			member.id === this.author ||
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
			debrief: this.debrief,
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
			registration: this.registration,
			requiredEquipment: this.requiredEquipment,
			showUpcoming: this.showUpcoming,
			signUpDenyMessage: this.signUpDenyMessage,
			signUpPartTime: this.signUpPartTime,
			requiredForms: this.requiredForms,
			fileIDs: copyFiles ? this.fileIDs : [],
			status: copyStatus ? this.status : EventStatus.INFORMATIONONLY,
			teamID: this.teamID,
			transportationDescription: this.transportationDescription,
			transportationProvided: this.transportationProvided,
			uniform: this.uniform,
			wingEventNumber: this.wingEventNumber,

			meetDateTime: this.meetDateTime - timeDelta,
			startDateTime: this.startDateTime - timeDelta,
			endDateTime: this.endDateTime - timeDelta,
			pickupDateTime: this.pickupDateTime - timeDelta
		};

		return Event.Create(newEvent, this.account, this.schema, member);
	}

	/**
	 * Links the event to another account
	 *
	 * @param targetAccount The account to link to
	 * @param member The member linking the event
	 */
	public linkTo(targetAccount: Account, member: MemberBase): Promise<Event> {
		const newEvent = Object.assign<{}, EventObject, Partial<EventObject>>(
			{},
			this,
			{
				accountID: targetAccount.id,
				author: member.id
			}
		);

		return Event.Create(newEvent, targetAccount, this.schema, member);
	}

	/**
	 * Deletes the current event
	 */
	public async delete(): Promise<void> {
		const eventsCollection = this.schema.getCollection<EventObject>(
			'Events'
		);

		await eventsCollection.removeOne(this._id);
	}

	/**
	 * Updates the values in a secure manner
	 *
	 * @param values The values to set
	 */
	public set(values: Partial<EventObject>): void {
		const keys: Array<keyof EventObject> = [
			'acceptSignups',
			'accountID',
			'activity',
			'administrationComments',
			'author',
			'comments',
			'complete',
			'debrief',
			'desiredNumberOfParticipants',
			'endDateTime',
			'eventWebsite',
			'fileIDs',
			'groupEventNumber',
			'highAdventureDescription',
			'location',
			'lodgingArrangments',
			'mealsDescription',
			'meetDateTime',
			'meetLocation',
			'name',
			'participationFee',
			'pickupDateTime',
			'pickupLocation',
			'pointsOfContact',
			'publishToWingCalendar',
			'registration',
			'requiredEquipment',
			'requiredForms',
			'showUpcoming',
			'signUpDenyMessage',
			'signUpPartTime',
			'sourceEvent',
			'startDateTime',
			'status',
			'teamID',
			'transportationDescription',
			'transportationProvided',
			'uniform',
			'wingEventNumber'
		];

		for (const key of keys) {
			if (typeof values[key] === typeof this[key]) {
				this[key] = values[key];
			}
		}
	}

	/**
	 * Converts the current event to a transferable object
	 */
	public toRaw = (member?: MemberBase): EventObject => ({
		_id: this._id,
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
		participationFee: this.participationFee,
		pickupDateTime: this.pickupDateTime,
		pickupLocation: this.pickupLocation,
		pointsOfContact: this.pointsOfContact,
		publishToWingCalendar: this.publishToWingCalendar,
		registration: this.registration,
		requiredEquipment: this.requiredEquipment,
		requiredForms: this.requiredForms,
		showUpcoming: this.showUpcoming,
		signUpDenyMessage: this.signUpDenyMessage ? this.signUpDenyMessage : null,
		signUpPartTime: !!this.signUpPartTime,
		sourceEvent: this.sourceEvent ? this.sourceEvent : null,
		startDateTime: this.startDateTime,
		status: this.status,
		teamID: this.teamID,
		timeCreated: this.timeCreated,
		timeModified: this.timeModified,
		transportationDescription: this.transportationDescription,
		transportationProvided: this.transportationProvided,
		uniform: this.uniform,
		wingEventNumber: this.wingEventNumber ? this.wingEventNumber : null,
		fileIDs: this.fileIDs,
		attendance:
			member === null || member === undefined ? [] : this.getAttendance()
	});

	/**
	 * toRaw conditionally provides the attendance based on parameters
	 *
	 * This method returns the full, raw object unconditionally
	 */
	public toFullRaw = (): EventObject => ({
		...(this.toRaw()),
		attendance: this.getAttendance()
	});

	// ----------------------------------------------------
	// 					Attendance code
	// ----------------------------------------------------

	/**
	 * Returns the attendance for the event
	 */
	public getAttendance = (): AttendanceRecord[] => this.attendance.map(v => ({
		...v,
		arrivalTime: v.arrivalTime ? v.arrivalTime : null,
		departureTime: v.departureTime ? v.departureTime : null
	}));

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
				memberID: member.id,
				memberRankName: member.memberRankName,
				planToUseCAPTransportation:
					newAttendanceRecord.planToUseCAPTransportation,
				requirements: newAttendanceRecord.requirements,
				status: newAttendanceRecord.status,
				summaryEmailSent: false,
				timestamp: +DateTime.utc(),

				// If these are undefined, they are staying for the whole event
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
		(this.attendance = this.attendance.map(
			record =>
				record.memberID === member.id
					? {
							comments: newAttendanceRecord.comments,
							memberID: member.id,
							memberRankName: member.memberRankName,
							planToUseCAPTransportation:
								newAttendanceRecord.planToUseCAPTransportation,
							requirements: newAttendanceRecord.requirements,
							status: newAttendanceRecord.status,
							summaryEmailSent: false,
							timestamp: +DateTime.utc(),

							// If these are undefined, they are staying for the whole event
							arrivalTime: newAttendanceRecord.arrivalTime,
							departureTime: newAttendanceRecord.departureTime
					  }
					: record
		));

	public removeMemberFromAttendance = (
		member: BaseMember
	): AttendanceRecord[] =>
		(this.attendance = this.attendance.filter(
			record => record.memberID !== member.id
		));
}

export { EventStatus };
