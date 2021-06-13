/**
 * Copyright (C) 2021 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { labels } from '..';
import { applyCustomAttendanceFields } from '../lib/Events';
import { defaultRadioFromLabels, emptyFromLabels, emptySimpleFromLabels } from '../lib/forms';
import { Maybe } from '../lib/Maybe';
import {
	AccountObject,
	AccountType,
	AttendanceRecord,
	AttendanceStatus,
	EventStatus,
	EventType,
	Identifiable,
	NewEventObject,
	RawAttendanceDBRecord,
	RawRegularEventObject,
} from '../typings/types';

export const getTestNewEvent = (): NewEventObject => ({
	name: '',
	subtitle: '',
	meetDateTime: 0,
	meetLocation: '',
	startDateTime: 0,
	location: '',
	endDateTime: 0,
	pickupDateTime: 0,
	pickupLocation: '',
	transportationProvided: false,
	transportationDescription: '',
	uniform: emptySimpleFromLabels(labels.Uniforms),
	desiredNumberOfParticipants: 8,
	registration: null,
	participationFee: null,
	mealsDescription: emptyFromLabels(labels.Meals),
	lodgingArrangments: emptyFromLabels(labels.LodgingArrangments),
	activity: emptyFromLabels(labels.Activities),
	highAdventureDescription: '',
	requiredEquipment: [],
	eventWebsite: '',
	requiredForms: emptyFromLabels(labels.RequiredForms),
	comments: '',
	memberComments: '',
	acceptSignups: true,
	signUpDenyMessage: '',
	showUpcoming: true,
	groupEventNumber: defaultRadioFromLabels(['Not Required', 'To Be Applied For', 'Applied For']),
	regionEventNumber: defaultRadioFromLabels(['Not Required', 'To Be Applied For', 'Applied For']),
	complete: false,
	administrationComments: '',
	status: EventStatus.DRAFT,
	pointsOfContact: [],
	customAttendanceFields: [],
	signUpPartTime: false,
	teamID: null,
	limitSignupsToTeam: false,
	fileIDs: [],
	privateAttendance: false,
	emailBody: Maybe.none(),
});

export const getTestAccount = (): AccountObject => ({
	aliases: ['vsqdn1'],
	comments: '',
	discordServer: Maybe.none(),
	id: 'vw101',
	mainCalendarID: '',
	mainOrg: 9006,
	orgIDs: [9006],
	parentGroup: { value: 'vw011', hasValue: true },
	parentWing: { value: 'vw001', hasValue: true },
	type: AccountType.CAPSQUADRON,
});

export const getTestEvent = (account: Identifiable): RawRegularEventObject => ({
	...getTestNewEvent(),
	id: 0,
	timeModified: 0,
	timeCreated: 0,
	author: {
		type: 'CAPNHQMember',
		id: 0,
	},
	debrief: [],
	googleCalendarIds: {},
	type: EventType.REGULAR,
	accountID: account.id as string,
});

export const getTestAttendanceRecord = (event: RawRegularEventObject): AttendanceRecord => ({
	comments: '',
	customAttendanceFieldValues: applyCustomAttendanceFields(event.customAttendanceFields)([]),
	memberID: {
		type: 'CAPNHQMember',
		id: 0,
	},
	memberName: '',
	planToUseCAPTransportation: false,
	shiftTime: {
		arrivalTime: 0,
		departureTime: 0,
	},
	sourceAccountID: '',
	sourceEventID: event.id,
	status: AttendanceStatus.COMMITTEDATTENDED,
	summaryEmailSent: false,
	timestamp: 0,
});

export const getTestRawAttendanceRecord = (
	event: RawRegularEventObject,
): RawAttendanceDBRecord => ({
	comments: '',
	customAttendanceFieldValues: applyCustomAttendanceFields(event.customAttendanceFields)([]),
	memberID: {
		type: 'CAPNHQMember',
		id: 0,
	},
	memberName: '',
	planToUseCAPTransportation: false,
	shiftTime: {
		arrivalTime: 0,
		departureTime: 0,
	},
	accountID: '',
	eventID: event.id,
	status: AttendanceStatus.COMMITTEDATTENDED,
	summaryEmailSent: false,
	timestamp: 0,
});
