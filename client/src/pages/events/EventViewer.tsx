import {
	AttendanceRecord,
	EventStatus,
	MemberReference,
	NewAttendanceRecord,
	NHQMemberReference,
	PointOfContactType,
	ProspectiveMemberReference
} from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import AttendanceItemView from '../../components/AttendanceView';
import Button from '../../components/Button';
import { DialogueButtons } from '../../components/dialogues/Dialogue';
import DialogueButton from '../../components/dialogues/DialogueButton';
import DialogueButtonForm from '../../components/dialogues/DialogueButtonForm';
import DropDownList from '../../components/DropDownList';
import { parseMultCheckboxReturn } from '../../components/form-inputs/MultCheckbox';
import { DateTimeInput, Label, TextBox } from '../../components/forms/SimpleForm';
import AttendanceForm from '../../components/forms/usable-forms/AttendanceForm';
import { Activities, RequiredForms, Uniforms } from '../../components/forms/usable-forms/EventForm';
import Loader from '../../components/Loader';
import SigninLink from '../../components/SigninLink';
import Event from '../../lib/Event';
import MemberBase, { CAPMemberClasses } from '../../lib/Members';
import Page, { PageProps } from '../Page';
import './EventViewer.css';

const noop = () => void 0;

interface EventViewerState {
	event: Event | null;
	error?: string;
	previousUpdatedMember: MemberReference;
	newTime: number;
	cadetRoster: CAPMemberClasses[] | null;
	seniorRoster: CAPMemberClasses[] | null;
	eventRegistry: boolean;
}

type EventViewerProps = PageProps<{ id: string }>;

const zeroPad = (n: number, a = 2) => ('00' + n).substr(-a);

const formatDate = (date: number) => {
	const dateObject = new Date(date);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${zeroPad(hour)}:${zeroPad(minute)} on ${zeroPad(month + 1)}/${zeroPad(day)}/${year}`;
};

const eventStatus = (stat: EventStatus): string =>
	stat === EventStatus.COMPLETE
		? 'Complete'
		: stat === EventStatus.CANCELLED
		? 'Cancelled'
		: stat === EventStatus.CONFIRMED
		? 'Confirmed'
		: stat === EventStatus.DRAFT
		? 'Draft'
		: stat === EventStatus.INFORMATIONONLY
		? 'Information Only'
		: stat === EventStatus.TENTATIVE
		? 'Tentative'
		: '';

export const attendanceStatusLabels = [
	'Commited/Attended',
	'No show',
	'Rescinded commitment to attend'
];

export default class EventViewer extends Page<EventViewerProps, EventViewerState> {
	public state: EventViewerState = {
		event: null,
		error: '',
		previousUpdatedMember: {
			type: 'Null'
		},
		newTime: 0,
		cadetRoster: null,
		seniorRoster: null,
		eventRegistry: false
	};

	constructor(props: EventViewerProps) {
		super(props);

		this.addAttendanceRecord = this.addAttendanceRecord.bind(this);
		this.clearPreviousMember = this.clearPreviousMember.bind(this);
		this.removeAttendanceRecord = this.removeAttendanceRecord.bind(this);

		this.moveEvent = this.moveEvent.bind(this);
		this.copyMoveEvent = this.copyMoveEvent.bind(this);
		this.copyEvent = this.copyEvent.bind(this);
		this.deleteEvent = this.deleteEvent.bind(this);
	}

	public async componentDidMount() {
		let event: Event;

		try {
			event =
				this.state.event ||
				(await Event.Get(
					parseInt(this.props.routeProps.match.params.id.split('-')[0], 10),
					this.props.member,
					this.props.account
				));
		} catch (e) {
			this.setState({
				error: 'Could not find event'
			});
			return;
		}

		// Make this work sometime?
		// With this uncommented, the page rerenders an extra time
		// This causes there to be two web requests
		// If this can be done without unmounting/remounting, that would be great
		// this.updateURL(event.getEventURL());

		this.props.updateBreadCrumbs([
			{
				text: 'Home',
				target: '/'
			},
			{
				target: '/calendar',
				text: 'Calendar'
			},
			{
				target: event.getEventURL(),
				text: `View ${event.name}`
			}
		]);

		if (this.props.member && event.canSignUpForEvent(this.props.member)) {
			this.props.updateSideNav([
				{
					target: 'information',
					text: 'Event Information',
					type: 'Reference'
				},
				{
					target: 'signup',
					text: 'Sign up',
					type: 'Reference'
				},
				{
					target: 'attendance',
					text: 'Attendance',
					type: 'Reference'
				}
			]);
		} else if (this.props.member) {
			this.props.updateSideNav([
				{
					target: 'information',
					text: 'Event Information',
					type: 'Reference'
				},
				{
					target: 'attendance',
					text: 'Attendance',
					type: 'Reference'
				}
			]);
		} else {
			this.props.updateSideNav([
				{
					target: 'information',
					text: 'Event Information',
					type: 'Reference'
				}
			]);
		}

		this.updateTitle(`View event ${event.name}`);

		this.setState({
			event
		});
	}

	public render() {
		if (this.state.error !== '') {
			return <div>{this.state.error}</div>;
		}

		const { event } = this.state;
		const { member } = this.props;

		if (event === null) {
			return <Loader />;
		}

		return (
			<>
				<div className="eventviewerroot">
					{member && member.isPOCOf(event) ? (
						<>
							<Link to={`/eventform/${event.id}`}>Edit event "{event.name}"</Link>
							{' | '}
							<DialogueButtonForm<{ newTime: number }>
								buttonText="Move event"
								buttonClass="underline-button"
								buttonType="none"
								displayButtons={DialogueButtons.YES_NO_CANCEL}
								onYes={this.moveEvent}
								onNo={this.copyMoveEvent}
								title="Move event"
								labels={['Move event', 'Copy move event', 'Cancel']}
								values={{
									newTime: event.startDateTime
								}}
							>
								<TextBox name="null">
									<span
										style={{
											lineHeight: '1px'
										}}
									>
										<span style={{ color: 'red' }}>WARNING:</span> moving this
										event may cause confusion.
										<br />
										Consider instead copying this event, and marking
										<br />
										this event as cancelled.
										<br />
										<br />
										Or, click the 'Copy move button' to perform this
										<br />
										action automatically
									</span>
								</TextBox>

								<Label>New start time of event</Label>
								<DateTimeInput
									name="newTime"
									date={true}
									time={true}
									originalTimeZoneOffset={'America/New_York'}
								/>
							</DialogueButtonForm>
							{' | '}
							<DialogueButtonForm<{ newTime: number }>
								buttonText="Copy event"
								buttonType="none"
								buttonClass="underline-button"
								displayButtons={DialogueButtons.OK_CANCEL}
								onOk={this.copyEvent}
								title="Move event"
								labels={['Copy event', 'Cancel']}
								values={{
									newTime: event.startDateTime
								}}
							>
								<Label>Start time of new event</Label>
								<DateTimeInput
									name="newTime"
									date={true}
									time={true}
									originalTimeZoneOffset={'America/New_York'}
								/>
							</DialogueButtonForm>
							{' | '}
							<DialogueButton
								buttonText="Delete event"
								buttonType="none"
								buttonClass="underline-button"
								displayButtons={DialogueButtons.OK_CANCEL}
								onOk={this.deleteEvent}
								title="Delete event"
								labels={['Yes', 'No']}
							>
								Really delete event?
							</DialogueButton>
							{' | '}
							<Link to={`/multiadd/${event.id}`}>Add attendance</Link>
							{' | '}
							<Button buttonType="none">Print Cadet Roster</Button>
							{' | '}
							<Button buttonType="none">Print Senior Roster</Button>
							{' | '}
							<Button buttonType="none">Print Event Registry</Button>
							<br />
							<br />
						</>
					) : null}
					<div id="information">
						<strong>Event: </strong> {event.name}
						<br />
						<strong>Event ID: </strong> {event.accountID.toUpperCase()}-{event.id}
						<br />
						<strong>Meet</strong> at {formatDate(event.meetDateTime)} at{' '}
						{event.location}
						<br />
						<strong>Start</strong> at {formatDate(event.startDateTime)} at{' '}
						{event.location}
						<br />
						<strong>End</strong> at {formatDate(event.endDateTime)}
						<br />
						<strong>Pickup</strong> at {formatDate(event.pickupDateTime)} at{' '}
						{event.pickupLocation}
						<br />
						<br />
						<strong>Transportation provided:</strong>{' '}
						{event.transportationProvided ? 'YES' : 'NO'}
						<br />
						{event.transportationProvided ? (
							<>
								<strong>Transportation Description:</strong>{' '}
								{event.transportationDescription}
								<br />
							</>
						) : null}
						<strong>Uniform:</strong>{' '}
						{parseMultCheckboxReturn(event.uniform, Uniforms, false)}
						<br />
						<strong>Comments:</strong> {event.comments}
						<br />
						<strong>Activity:</strong>{' '}
						{parseMultCheckboxReturn(event.activity, Activities, true)}
						<br />
						<strong>Required forms:</strong>{' '}
						{parseMultCheckboxReturn(event.requiredForms, RequiredForms, true)}
						<br />
						<strong>Event status:</strong> {eventStatus(event.status)}
						<br />
						<br />
						<div>
							{event.pointsOfContact.map((poc, i) =>
								poc.type === PointOfContactType.INTERNAL ? (
									<div key={i}>
										<b>CAP Point of Contact: </b>
										{poc.name}
										<br />
										{!!poc.email ? (
											<>
												<b>CAP Point of Contact Email: </b>
												{poc.email}
												<br />
											</>
										) : null}
										{!!poc.phone ? (
											<>
												<b>CAP Point of Contact Phone: </b>
												{poc.phone}
												<br />
											</>
										) : null}
										<br />
									</div>
								) : (
									<div key={i}>
										<b>External Point of Contact: </b>
										{poc.name}
										<br />
										{poc.email !== '' ? (
											<>
												<b>External Point of Contact Email: </b>
												{poc.email}
												<br />
											</>
										) : null}
										{poc.phone !== '' ? (
											<>
												<b>External Point of Contact Phone: </b>
												{poc.phone}
												<br />
											</>
										) : null}
										<br />
									</div>
								)
							)}
						</div>
					</div>
					{member !== null ? (
						<div id="signup">
							{event.canSignUpForEvent(this.props.member) ? (
								<AttendanceForm
									account={this.props.account}
									event={event}
									member={member}
									updateRecord={this.addAttendanceRecord}
									updated={false}
									clearUpdated={this.clearPreviousMember}
									removeRecord={noop}
								/>
							) : null}
							<h2 id="attendance">Attendance</h2>
							<DropDownList
								titles={val =>
									`${
										(val.memberID as
											| NHQMemberReference
											| ProspectiveMemberReference).id
									}: ${val.memberName}`
								}
								values={event.attendance}
								onlyOneOpen={true}
							>
								{(val, i) => (
									<AttendanceItemView
										attendanceRecord={val}
										clearUpdated={this.clearPreviousMember}
										owningAccount={this.props.account}
										owningEvent={event}
										member={member}
										removeAttendance={this.removeAttendanceRecord}
										updateAttendance={this.addAttendanceRecord}
										updated={MemberBase.AreMemberReferencesTheSame(
											this.state.previousUpdatedMember,
											val.memberID
										)}
										key={i}
									/>
								)}
							</DropDownList>
							{event.attendance.length === 0 ? (
								<div>No attendance records</div>
							) : null}
						</div>
					) : (
						<SigninLink {...this.props.fullMemberDetails}>
							Sign in to see more information
						</SigninLink>
					)}
				</div>
				<div className="cadetroster">
					{this.state.cadetRoster !== null ? (
						<div>
							<img
								className="caplogobw"
								src="/images/CAP_Seal_Monochrome.PNG"
								alt="CAP Logo"
							/>
							<h2>Cadet Attendance Log</h2>
							<strong>Date:</strong> {formatDate(event.startDateTime)}{' '}
							<strong>Location:</strong> CAP St. Marys
							<strong>Uniform: </strong>
							<table>
								<tr>
									<th>First</th>
									<th>Second</th>
									<th>Third</th>
								</tr>
								<tr>
									<td>Data 1</td>
									<td>Data 2</td>
									<td>Data 3</td>
								</tr>
							</table>
						</div>
					) : null}
				</div>
			</>
		);
	}

	private addAttendanceRecord(record: NewAttendanceRecord, member: MemberReference) {
		this.setState({
			previousUpdatedMember: member
		});
	}

	private removeAttendanceRecord(record: AttendanceRecord) {
		this.forceUpdate();
	}

	private clearPreviousMember() {
		this.setState({
			previousUpdatedMember: {
				type: 'Null'
			}
		});
	}

	private async moveEvent({ newTime }: { newTime: number }) {
		if (!this.state.event) {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			throw new Error('Attempting to mvoe an event without authorization');
		}

		const event = this.state.event;

		const timeDelta = newTime - event.startDateTime;

		event.meetDateTime += timeDelta;
		event.startDateTime = newTime;
		event.endDateTime += timeDelta;
		event.pickupDateTime += timeDelta;

		await event.save(this.props.member);

		this.forceUpdate();
	}

	private async copyMoveEvent({ newTime }: { newTime: number }) {
		if (!this.state.event) {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			throw new Error('Attempting to mvoe an event without authorization');
		}

		const newEvent = await this.state.event.copy(newTime, this.props.member);

		this.state.event.status = EventStatus.CANCELLED;

		await this.state.event.save(this.props.member);

		if (newEvent) {
			this.props.routeProps.history.push(`/eventviewer/${newEvent.id}`);
		}
	}

	private async copyEvent({ newTime }: { newTime: number }) {
		if (!this.state.event) {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			throw new Error('Attempting to move an event without authorization');
		}

		const newEvent = await this.state.event.copy(newTime, this.props.member);

		if (newEvent) {
			this.props.routeProps.history.push(`/eventviewer/${newEvent.id}`);
		}
	}

	private async deleteEvent() {
		if (!this.state.event) {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			throw new Error('Attempting to delete an event without authorization');
		}

		await this.state.event.delete(this.props.member);

		this.props.routeProps.history.push(`/calendar`);
	}

	private async fetchCadetRoster() {
		if (!this.state.event) {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			throw new Error('Attempting to delete an event without authorization');
		}
		const roster = await this.props.account.getMembers();

		const cadetRoster = roster.filter(member => !member.seniorMember);
		this.setState({ cadetRoster });
	}

	private async fetchSeniorRoster() {
		if (!this.state.event) {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			throw new Error('Attempting to delete an event without authorization');
		}
		const roster = await this.props.account.getMembers();

		const seniorRoster = roster.filter(member => member.seniorMember);
		this.setState({ seniorRoster });
	}

	private fetchEventRegistry() {
		// do stuff
	}
}
