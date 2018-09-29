import { RawDraftContentState } from 'draft-js';
import {
	AttendanceStatus,
	EventStatus,
	MemberCreateError,
	PointOfContactType,
	TeamPublicity
} from './index';

declare global {
	/**
	 * Table for SQL definitions for CAP NHQ
	 *
	 * Documentation is not provided by NHQ
	 */
	export namespace NHQ {
		export interface CadetAchv {
			CAPID: number;
			CadetAchvID: number;
			PhyFitTest: string;
			LeadLabDateP: string;
			LeadLabScore: number;
			AEDateP: string;
			AEScore: number;
			AEMod: number;
			AETest: number;
			MoralLDateP: string;
			ActivePart: number;
			OtherReq: number;
			SDAReport: number;
			UsrID: string;
			DateMod: string;
			FirstUsr: string;
			DateCreated: string;
			DrillDate: string;
			DrillScore: number;
			LeadCurr: string;
			CadetOath: number;
			AEBookValue: string;
			MileRun: number;
			ShuttleRun: number;
			SitAndReach: number;
			PushUps: number;
			CurlUps: number;
		}

		export interface CadetAchvAprs {
			CAPID: number;
			CadetAchvID: number;
			Status: string;
			AprCAPID: number;
			DspReason: string;
			AwardNo: number;
			JROTCWaiver: number;
			UsrID: number;
			DateMod: string;
			FirstUsr: string;
			DateCreated: string;
			PrintedCert: number;
		}

		export interface CadetDutyPosition {
			CAPID: number;
			Duty: string;
			FunctArea: string;
			Lvl: string;
			Asst: number;
			UsrID: string;
			DateMod: string;
			ORGID: number;
		}

		export interface DutyPosition {
			CAPID: number;
			Duty: string;
			FunctArea: string;
			Lvl: string;
			Asst: number;
			UsrID: string;
			DateMod: string;
			ORGID: number;
		}

		export interface MbrContact {
			CAPID: number;
			Type: MemberContactType;
			Priority: MemberContactPriority;
			Contact: string;
			UsrID: string;
			DateMod: string;
			DoNotContact: number;
		}

		export interface Member {
			CAPID: number;
			SSN: '';
			NameLast: string;
			NameFirst: string;
			NameMiddle: string;
			NameSuffix: string;
			Gender: string;
			DOB: string;
			Profession: string;
			EducationLevel: string;
			Citizen: string;
			ORGID: number;
			Wing: string;
			Unit: string;
			Rank: string;
			Joined: string;
			Expiration: string;
			OrgJoined: string;
			UsrID: string;
			DateMod: string;
			LSCode: string;
			Type: 'CADET' | 'SENIOR' | 'PATRON';
			RankDate: string;
			Region: string;
			MbrStatus: string;
			PicStatus: string;
			PicDate: string;
			CdtWaiver: string;
		}

		export interface OrgAddresses {
			ORGID: number;
			Wing: string;
			Unit: string;
			Type: string;
			Priority: string;
			Addr1: string;
			Addr2: string;
			City: string;
			State: string;
			Zip: string;
			Latitude: string;
			Longitude: string;
			UsrID: string;
			DateMod: string;
		}

		export interface Organization {
			ORGID: number;
			Region: string;
			Wing: string;
			Unit: string;
			NextLevel: number;
			Name: string;
			Type: string;
			DateChartered: string;
			Status: string;
			Scope: string;
			UsrID: string;
			DateMod: string;
			FirstUsr: string;
			DateCreated: string;
			DateReceived: string;
			OrgNotes: string;
		}

		export interface OrgContact {
			ORGID: number;
			Wing: string;
			Unit: string;
			Type: string;
			Priority: string;
			Contact: string;
			UsrID: string;
			DateMod: string;
		}

		export interface OrgMeetings {
			ORGID: number;
			Wing: string;
			Unit: string;
			MeetTime: string;
			MeetDay: string;
			ActivityDate: string;
			Descr: string;
			UsrID: string;
			DateMod: string;
		}
	}

	/**
	 * Allows for compiling of for-await-of loops
	 */
	export interface AsyncIterableIterator<T> {
		next(value?: any): Promise<IteratorResult<T>>;
		return?(value?: any): Promise<IteratorResult<T>>;
		throw?(e?: any): Promise<IteratorResult<T>>;
	}

	/**
	 * As the return types are complex, keeping them consistent is key
	 */
	export type MultCheckboxReturn = [boolean[], string];
	export type RadioReturn<T extends number> = [T, string];

	export interface NHQMemberObjectReturn {
		kind: 'NHQMember';
		object: MemberObject;
	}

	export interface ProspectiveMemberReturn {
		kind: 'ProspectiveMember';
		object: ProspectiveMemberAccount;
	}

	/**
	 * The object that represents a successful session, as signing in
	 * returns a session
	 */
	export interface SuccessfulSigninReturn {
		/**
		 * No error with this session
		 */
		error: MemberCreateError.NONE;
		/**
		 * The member details
		 */
		member: NHQMemberObjectReturn | ProspectiveMemberReturn;
		/**
		 * The ID for the session
		 */
		sessionID: string;
		/**
		 * Used by TypeScript/JavaScript to allow for type inference
		 * between success and failure
		 */
		valid: true;
	}

	export interface FailedSigninReturn {
		/**
		 * May contain error details
		 */
		error: MemberCreateError;
		/**
		 * The member cannot exist as the signin failed
		 */
		member: null;
		/**
		 * Session ID for an invalid session is empty
		 */
		sessionID: '';
		/**
		 * Used by TypeScript/JavaScript to allow for type inference
		 * between success and failure
		 */
		valid: false;
	}

	/**
	 * Allows for multiplexing the data together but still have type inference and
	 * not use try/catch
	 */
	export type SigninReturn = SuccessfulSigninReturn | FailedSigninReturn;

	/**
	 * A basic point of contact
	 */
	export interface PointOfContact {
		/**
		 * Used by TypeScript/JavaScript to differentiate between different
		 * points of contact
		 */
		type: PointOfContactType;
		/**
		 * All points of contact have an email
		 */
		email: string;
		/**
		 * All of them should have a phone number
		 */
		phone: string;

		// Email settings for a POC
		/**
		 * Receive a notification for them being a POC
		 */
		receiveUpdates: boolean;
		/**
		 * Email the roster to the POC at some point in time
		 */
		receiveRoster: boolean;
		/**
		 * Email updates for the event
		 */
		receiveEventUpdates: boolean;
		/**
		 * Email whenever someone signs up
		 */
		receiveSignUpUpdates: boolean;
	}

	export interface InternalPointOfContact extends PointOfContact {
		/**
		 * Used for differentiating CAP points of contact
		 */
		type: PointOfContactType.INTERNAL;
		/**
		 * CAP ID
		 */
		id: number;
	}

	export interface ExternalPointOfContact extends PointOfContact {
		/**
		 * Used for differentiating non CAP points of contact
		 */
		type: PointOfContactType.EXTERNAL;
		/**
		 * As we don't have CAP ID, we can't pull name or rank
		 */
		name: string;
	}

	/**
	 * Mark documents as NoSQL, for interaction with the database
	 *
	 * But not too close, because an object may not have been created and
	 * therefore not have an _id
	 */
	export interface NoSQLDocument {
		/**
		 * The ID assigned by NoSQL/MySQL
		 */
		_id?: string;
	}

	/**
	 * Used by certain classes to say this object can't be undefined. NoSQLDocument
	 * is used when the object is being created and information cannot be known about
	 * it
	 */
	export type FullDBObject<T extends NoSQLDocument> = T &
		Required<NoSQLDocument>;

	/**
	 * Most classes interact with the database in some way; just define some
	 * common ground for them
	 */
	export interface DatabaseInterface<T extends NoSQLDocument> {
		/**
		 * Return the object in a manner that is safe for JSON transfer
		 *
		 * Useful for when making sure the wrong data doesn't get transferred
		 * to the client
		 */
		toRaw(): T;
		/**
		 * Checks all the values coming in, making sure they are the right type and
		 * setting them if they are the right type and defined
		 *
		 * @param values The values to set
		 */
		set(values: Partial<T>): void;
		/**
		 * Save the document to the database
		 */
		save(): Promise<void>;
	}

	/**
	 * Most objects are identifiable; this also allows for general purpose libraries
	 * to filter or perform other operations on generally identifiable objects
	 */
	export interface Identifiable {
		/**
		 * The ID an object has. This is different from a NoSQL ID, as most of these
		 * are set by NHQ or by us
		 */
		id: string | number;
	}

	/**
	 * Says that there is another ID to listen to, the account ID
	 */
	export interface AccountIdentifiable extends Identifiable {
		/**
		 * The ID of the account the folder belongs to
		 */
		accountID: string;
	}

	/**
	 * The member contact info for a user
	 *
	 * We think it can only be a string, as it is hard (impossible?) to input
	 * multiple contacts of a certain type through the UI provided on NHQ
	 */
	export interface MemberContactInstance {
		/**
		 * First contact to try and raise
		 */
		PRIMARY: string;
		/**
		 * Second contact to try and raise
		 */
		SECONDARY: string;
		/**
		 * Only used for emergency; go through the primary and secondary
		 * contacts first
		 */
		EMERGENCY: string;
	}

	/**
	 * Currently, there are only 4 member access levels and for some reason
	 * they are a list of strings vs an enum (why?)
	 */
	export type MemberAccessLevel = 'Member' | 'Staff' | 'Manager' | 'Admin';

	/**
	 * Contains all the contact info for the member, according to NHQ
	 */
	export interface MemberContact {
		/**
		 * A contact method to use to get in touch with the member
		 */
		ALPHAPAGER: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		ASSISTANT: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		CADETPARENTEMAIL: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		CADETPARENTPHONE: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		CELLPHONE: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		DIGITALPAGER: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		EMAIL: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		HOMEFAX: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		HOMEPHONE: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		INSTANTMESSAGER: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		ISDN: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		RADIO: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		TELEX: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		WORKFAX: MemberContactInstance;
		/**
		 * A contact method to use to get in touch with the member
		 */
		WORKPHONE: MemberContactInstance;
	}

	/**
	 * Used for looping through the contact types
	 */
	export type MemberContactType = keyof MemberContact;

	/**
	 * Used for getting priorities and such
	 */
	export type MemberContactPriority = keyof MemberContactInstance;

	/**
	 * The permissions list for various members
	 */
	export interface MemberPermissions {
		// Start the Cadet Staff permissions
		/**
		 * Whether or not the user can assign flight members
		 */
		FlightAssign: number;
		/**
		 * Whether or not the user can get the muster sheet
		 */
		MusterSheet: number;
		/**
		 * Whether or not the user can get PT sheets
		 */
		PTSheet: number;
		/**
		 * Whether or not the user can manage promotions
		 */
		PromotionManagement: number;
		/**
		 * Whether or not the user can assign tasks
		 */
		AssignTasks: number;
		/**
		 * Whether or not the user can administer PT
		 */
		AdministerPT: number;
		/**
		 * Whether or not the user can download the cadet staff guide
		 */
		DownloadStaffGuide: number;

		// Start Manager permissions
		/**
		 * Whether or not the user can add an event
		 * 1 for they can add a draft event only
		 * 2 for full access
		 */
		AddEvent: number;
		/**
		 * Whether or not the user can
		 */
		EditEvent: number;
		/**
		 * Whether or not the user can get event contact information
		 */
		EventContactSheet: number;
		/**
		 * Whether or not the user can edit sign up information
		 */
		SignUpEdit: number;
		/**
		 * Whether or not the user can copy events
		 */
		CopyEvent: number;
		/**
		 * Whether or not the user can get ORM OPORD information
		 */
		ORMOPORD: number;
		/**
		 * Whether or not the user can delete events
		 */
		DeleteEvent: number;
		/**
		 * Whether or not the user can assign positions
		 */
		AssignPosition: number;

		// Admin privileges
		/**
		 * Whether or not the user can get the event status page
		 */
		EventStatusPage: number;
		/**
		 * Whether or not the user can manage prospective members
		 */
		ProspectiveMemberManagment: number;
		/**
		 * Whether or not the user can view a list of all events
		 */
		EventLinkList: number;
		/**
		 * Whether or not the user can add a team
		 */
		AddTeam: number;
		/**
		 * Whether or not the user can edit a team
		 */
		EditTeam: number;
		/**
		 * Whether or not the user can manage files
		 */
		FileManagement: number;
		/**
		 * Whether or not the user can manage permissions of others
		 */
		PermissionManagement: number;
		/**
		 * Whether or not the user can download CAPWATCH files
		 */
		DownloadCAPWATCH: number;

		// Developer/super admin privileges?
		/**
		 * Whether or not the user can edit the registry
		 */
		RegistryEdit: number;
	}

	/**
	 * String representation of permissions
	 */
	export type MemberPermission = keyof MemberPermissions;

	/**
	 * String representation of the member type, as there needs to be a way to differentiate
	 */
	export type MemberType =
		| 'CAPWATCHMember'
		| 'NHQMember'
		| 'ProspectiveMember';

	/**
	 * Describes a CAP member
	 *
	 * The member may be created from one of many ways:
	 *
	 * NHQMember.Create/NHQMember.ExpressMiddleware/NHQMember.ConditionalExpressMiddleware:
	 * 		Takes sign in data or a session and signs the user in. Best data
	 * CAPWATCHMember.Get: Estimates the user based off of CAPWATCH data. As good as
	 * 		the CAPWATCH updates are frequent
	 * ProspectiveMember.Get/ProspectiveMember.Create/ProspectiveMember.Signin/
	 * NHQMember.ConditionalExpressMiddleware/NHQMember.ExpressMiddleware: Used for
	 * 		managing prospective members
	 *
	 * NHQMember.Create and ProspectiveMember.Signin are used when signing people in
	 * ProspectiveMember.Get and CAPWATCHMember.Get are used when pulling information from
	 * 		our database
	 *
	 * CAPWATCHMember and NHQMember have their sources in NHQ
	 * ProspectiveMember is located in our database
	 */
	export interface MemberObject extends Identifiable {
		/**
		 * The CAPID of the member
		 */
		id: number;
		/**
		 * The rank of the member provided
		 */
		memberRank: string;
		/**
		 * Whether or not the member is a senior member
		 */
		seniorMember: boolean;
		/**
		 * Contact information for the user
		 */
		contact: MemberContact;
		/**
		 * Duty positions listed on CAP NHQ, along with temporary ones assigned here
		 */
		dutyPositions: string[];
		/**
		 * The Squadron a member belongs to
		 */
		squadron: string;
		/**
		 * First name of member
		 */
		nameFirst: string;
		/**
		 * Middle name of member
		 */
		nameMiddle: string;
		/**
		 * Last name of member
		 */
		nameLast: string;
		/**
		 * Suffix of member
		 */
		nameSuffix: string;
		/**
		 * Which flight the user is in. Should only exist if not a senior member
		 */
		flight?: string;
		/**
		 * The organization the member belongs to
		 */
		orgid: number;
		/**
		 * Since many accounts can have an ORGID, there is an array containing each one
		 *
		 * @deprecated Let's go with a member method to use an async generator to get each one
		 */
		// accounts: Account[]
		/**
		 * User login ID
		 */
		usrID: string;
		/**
		 * The Kind of user, as there are multiple
		 */
		kind: MemberType;
		/**
		 * Both the client and server will want a handle on permissions
		 */
		permissions: MemberPermissions;
	}

	/**
	 * Used when referring to members, as numerical CAPIDs do not work as well with
	 * ProspectiveMembers
	 */
	interface MemberReferenceBase {
		kind: MemberType;
	}

	export interface ProspectiveMemberReference extends MemberReferenceBase {
		kind: 'ProspectiveMember';
		id: string;
	}

	export interface NHQMemberReference extends MemberReferenceBase {
		kind: 'NHQMember';
		id: number;
	}

	/**
	 * Union type to allow for referring to both NHQMembers and ProspectiveMembers
	 */
	export type MemberReference =
		| NHQMemberReference
		| ProspectiveMemberReference;

	/**
	 * In the case that it doesn't like MemberBase, try using Member
	 */
	export type Member = ProspectiveMemberAccount | MemberObject;

	/**
	 * Records temporary duty positions that we assign
	 */
	interface TemporaryDutyPosition {
		/**
		 * How long the temporary duty position is valid for; they are temporary
		 * because someone may only need to have a position for a single meeting week
		 */
		validUntil: number;

		/**
		 * Following NHQ naming, as this is used by Member to in a slick
		 * MapReduce way
		 */
		Duty: string;
	}

	/**
	 * Extra member information that may need to be stored for the user that
	 * our website uses and NHQ doesn't, for instance temporary duty positions and
	 * permissions
	 */
	export interface ExtraMemberInformation
		extends AccountIdentifiable,
			NoSQLDocument {
		/**
		 * CAPID
		 */
		id: number;
		/**
		 * Extra duty positions that are assigned to the member
		 */
		temporaryDutyPositions: TemporaryDutyPosition[];
		/**
		 * Access level for the member
		 */
		accessLevel: MemberAccessLevel;
		/**
		 * Member flight
		 *
		 * Undefined if the member is a senior member
		 */
		flight?: string;
	}

	/**
	 * The object that splits all of the data used by different people to limit their views
	 * to what they want and what they have permissions for
	 */
	export interface AccountObject extends Identifiable, NoSQLDocument {
		/**
		 * The Account ID
		 */
		id: string;
		/**
		 * Whether or not the account is an echelon account
		 */
		echelon: boolean;
		/**
		 * The main organization of the account
		 */
		mainOrg: number;
		/**
		 * The ids of the organizations
		 */
		orgIDs: number[];
		/**
		 * Whether the account is a paid account
		 */
		paid: boolean;
		/**
		 * Whether the account is a valid paid account
		 *
		 * Valid paid means it is paid for and not expired
		 */
		validPaid: boolean;
		/**
		 * Whether the account is expired
		 */
		expired: boolean;
		/**
		 * Datetime when the account expires in
		 */
		expires: number;
		/**
		 * How many events can be used if this account is paid for
		 */
		paidEventLimit: number;
		/**
		 * How many events can be used if this account is unpaid for
		 */
		unpaidEventLimit: number;
		/**
		 * CAP IDs of the admins of this account
		 */
		adminIDs: MemberReference[];
	}

	/**
	 * Used by the different files to indicate what they are
	 *
	 * Follows the example of Google APIs
	 */
	export interface DriveObject extends AccountIdentifiable, NoSQLDocument {
		/**
		 * The kind of object it is, as these pass through JSON requests
		 */
		kind: string;
	}

	/**
	 * Represents a file. Metadata (shown) is stored in the database, other file
	 * data is stored on disk to take advantage of Node.js
	 */
	export interface FileObject extends DriveObject {
		/**
		 * Prevent duck typing to an extent
		 */
		kind: 'drive#file';
		/**
		 * The file identifier
		 */
		id: string;
		/**
		 * The id of the uploader
		 */
		uploaderID: number;
		/**
		 * The name of the file
		 */
		fileName: string;
		/**
		 * Comments about the file
		 */
		comments: string;
		/**
		 * The MIME type for the file
		 */
		contentType: string;
		/**
		 * The UTC unix time stamp of when the file was created
		 */
		created: number;
		/**
		 * Whether or not the file is limited to the members
		 */
		memberOnly: boolean;
		/**
		 * Whether or not the file is displayed in the photo library (only works with photos)
		 */
		forDisplay: boolean;
		/**
		 * Whether or not the file is to be shown in the slideshow
		 */
		forSlideshow: boolean;
		/**
		 * Children ids for folder
		 */
		fileChildren: string[];
		/**
		 * ID of the parent for going backwards
		 */
		parentID: string;
	}

	/**
	 * A blog post for peoplle to read
	 */
	export interface BlogPostObject
		extends AccountIdentifiable,
			NoSQLDocument,
			NewBlogPost {
		/**
		 * The ID of the blog post itself
		 */
		id: number;
		/**
		 * When it was published
		 */
		posted: number;
	}

	export interface NewBlogPost {
		/**
		 * The title of the blog post
		 */
		title: string;
		/**
		 * The blog post author
		 */
		authorid: MemberReference;
		/**
		 * What the author is trying to say
		 */
		content: RawDraftContentState;
		/**
		 * Pictures that will be presented below the post; if there
		 * are photos that will be embedded in the content, it will be in the `content`
		 * property and handled by Draft.js
		 */
		fileIDs: string[];
	}

	export interface NewBlogPage {
		/**
		 * The title of the page
		 */
		title: string;
		/**
		 * The page content
		 */
		content: RawDraftContentState;
	}

	export interface BlogPageObject
		extends AccountIdentifiable,
			NewBlogPage,
			NoSQLDocument {
		/**
		 * The id of the page, to get it by
		 */
		id: string;
		/**
		 * Each blog page can have a set of children
		 * 
		 * This contains an array to references of BlogPages
		 */
		children: string[];
	}

	/**
	 * The meat of what this website is designed for; events can be signed up for
	 * and hold information to facilitate easy information distribution
	 */
	export interface EventObject
		extends AccountIdentifiable,
			NoSQLDocument,
			NewEventObject {
		/**
		 * ID of the Event, can be expressed as the event number
		 */
		id: number;
		/**
		 * Last modify time
		 */
		timeModified: number;
		/**
		 * When the object was created
		 */
		timeCreated: number;
		/**
		 * Who made the event
		 */
		author: number;
		/**
		 * New events start with no attendance, but there can be procedurally
		 * generated attendance on the client side to include internal POCs
		 */
		attendance: AttendanceRecord[];
	}

	/**
	 * Used for transfer when creating a new event object, as it cannot know what
	 * some of the details are until the server handles it
	 */
	export interface NewEventObject {
		/**
		 * The name of the event (used to be EventName, dropped)
		 */
		name: string;
		/**
		 * When the event meets
		 */
		meetDateTime: number;
		/**
		 * Where the event meets
		 */
		meetLocation: string;
		/**
		 * When the event starts; this differs from meet time, as the event may
		 * have a place for people to gather to carpool
		 */
		startDateTime: number;
		/**
		 * The location of the event itself, differs from meet as stated above
		 */
		location: string;
		/**
		 * When the event finishes. Different from pickup the same way start and
		 * meet times are different. End location is implied to be the start
		 * location
		 */
		endDateTime: number;
		/**
		 * When cadets can be picked up from the event
		 */
		pickupDateTime: number;
		/**
		 * Where cadets will be, most likely will happen to be the meet location
		 * or event location
		 */
		pickupLocation: string;
		/**
		 * Whether or not transportation is provided from the meet location to
		 * the event location
		 */
		transportationProvided: boolean;
		/**
		 * Description; e.g., using a van
		 */
		transportationDescription: string;
		/**
		 * The uniforms that can be worn
		 */
		uniform: MultCheckboxReturn;
		/**
		 * How many people we want at the event
		 */
		desiredNumberOfParticipants: number;
		/**
		 * If there is a registration deadline, this is present
		 * As it is partial, not required information, this may be
		 * excluded
		 */
		registration?: {
			/**
			 * When the registration closes
			 */
			deadline: number;
			/**
			 * What information there is regarding registration closing
			 */
			information: string;
		};
		/**
		 * Same as registration deadline but for fees
		 */
		participationFee?: {
			/**
			 * When the fee is due
			 */
			feeDue: number;
			/**
			 * How much is due before showing up to the event
			 */
			feeAmount: number;
		};
		/**
		 * Describes the options for meals
		 */
		mealsDescription: MultCheckboxReturn;
		/**
		 * Describes where cadets may be sleeping
		 */
		lodgingArrangments: MultCheckboxReturn;
		/**
		 * Describes how strenuous the activity may be to cadets
		 */
		activity: MultCheckboxReturn;
		/**
		 * Describes how hard the activity may be
		 */
		highAdventureDescription: string;
		/**
		 * A list of things that will be required
		 *
		 * Should this only be shown to certain members? E.g., team members,
		 * signed in members, or just all?
		 */
		requiredEquipment: string[];
		/**
		 * External websites
		 */
		eventWebsite: string;
		/**
		 * Forms include CAP ID, CAPF 31, etc.
		 */
		requiredForms: MultCheckboxReturn;
		/**
		 * Comments from the event author, description, etc.
		 */
		comments: string;
		/**
		 * Whether or not signups are accepted
		 */
		acceptSignups: boolean;
		/**
		 * What to say if sign ups are denied; may be dropped if
		 * acceptSignups is true
		 */
		signUpDenyMessage?: string;
		/**
		 * If the wing calendar needs to have this event, publish to the Google calendar
		 */
		publishToWingCalendar: boolean;
		/**
		 * Show on the upcoming events portion of the main page
		 */
		showUpcoming: boolean;
		/**
		 * Is there a valid group number available?
		 */
		groupEventNumber: RadioReturn<number>;
		/**
		 * What is the wing event number
		 */
		wingEventNumber?: number;
		/**
		 * If all the details are completely filled in
		 */
		complete: boolean;
		/**
		 * Comments for/from administrators
		 */
		administrationComments: string;
		/**
		 * Tentative, complete, cancelled, etc.
		 */
		status: EventStatus;
		/**
		 * After action reports
		 */
		debrief: string;
		/**
		 * Who to contact for more event information
		 */
		pointsOfContact: (InternalPointOfContact | ExternalPointOfContact)[];
		/**
		 * Can cadets sign up for only a portion of the event?
		 */
		signUpPartTime?: boolean;
		/**
		 * If this is a team event, a team can be specified for future features
		 */
		teamID: number;
		/**
		 * Files that may be associated with the event; e.g. forms
		 */
		fileIDs: string[];
		/**
		 * If this is a linked event this will be present
		 *
		 * Linking events allows for one account to copy an event of another account
		 * and receive updates and such
		 */
		sourceEvent?: {
			/**
			 * ID of the event it came from
			 */
			id: number;
			/**
			 * The account linked from
			 */
			accountID: string;
		};
	}

	/**
	 * Used by the Event class to handle safely adding new records
	 */
	export interface NewAttendanceRecord {
		/**
		 * Comments from the cadet
		 */
		comments: string;
		/**
		 * Committed, rescindend commitment to attend, etc
		 */
		status: AttendanceStatus;
		/**
		 * ?
		 */
		requirements: string;
		/**
		 * If they plan to use transportation provided
		 */
		planToUseCAPTransportation: boolean;

		// If these are undefined, they are staying for the whole event
		/**
		 * If they are comming part time, this shows when they arrive
		 */
		arrivalTime?: number;
		/**
		 * If they are comming part time, this shows when they depart
		 */
		departureTime?: number;
	}

	/**
	 * A full attendance record that has been inserted in the database
	 */
	export interface AttendanceRecord extends NewAttendanceRecord {
		/**
		 * When they signed up
		 */
		timestamp: number;
		/**
		 * Who they are
		 */
		memberID: number;
		/**
		 * Record member rank and name to show what rank they were when
		 * they participated
		 */
		memberRankName: string;
		/**
		 * Whether or not the emails for this cadet/for the POCs have been sent
		 */
		summaryEmailSent: boolean;
	}

	/**
	 * Each account has a registry, stores configuration
	 */
	export interface RegistryValues extends NoSQLDocument, AccountIdentifiable {
		/**
		 * How to contact the account; email, social media, etc;
		 */
		contact: {
			/**
			 * Facebook page for the account
			 */
			facebook?: string;
			/**
			 * Instagram page for the account
			 */
			instagram?: string;
		};
		/**
		 * Website naming details
		 */
		website: {
			/**
			 * What the website is called
			 */
			name: string;
			/**
			 * -, ::, etc. Personal taste, used in the title of the page
			 */
			separator: string;
		};
	}

	/**
	 * Manages accounts on the website
	 *
	 * Ignored because there are conflicting id types
	 */
	export interface ProspectiveMemberAccount
		extends AccountIdentifiable,
			NoSQLDocument,
			MemberObject {
		/**
		 * Used to resolve compile errors, as AccountIdentifiable and NoSQLDocument inherit Identifiable which
		 * says id must be `number | string`
		 *
		 * Can be set to something else to 'link' it to a real CAP account
		 */
		id: number;
		/**
		 * User IDs will be something alphanumeric, e.g. P123456
		 */
		prospectiveID: string;
		/**
		 * The password for the user, hashed
		 */
		password: string;
		/**
		 * The salt used to compute the password
		 */
		salt: string;
		/**
		 * The kind is specifically a prospective member
		 */
		kind: 'ProspectiveMember';
	}

	/**
	 * Describes errors that are stored in the database
	 */
	export interface ErrorObject extends NoSQLDocument {
		/**
		 * Taken from the Error object
		 */
		stack: string;
		/**
		 * Requested path, used to recreate the error
		 */
		requestPath: string;
		/**
		 * User information
		 *
		 * Null if not signed in
		 */
		requestedUser: MemberReference | null;
		/**
		 * When did the error occur?
		 */
		timestamp: number;
		/**
		 * What is the error message?
		 */
		message: string;
	}

	/**
	 * For creating teams of cadets
	 */
	export interface NewTeamObject {
		/**
		 * All teams need a name, right?
		 */
		name: string;
		/**
		 * Who is on the team
		 */
		members: MemberReference[];
		/**
		 * Describe what the team does
		 */
		description: string;
		/**
		 * Who will be leading the team?
		 */
		cadetLeader: MemberReference | null;
		/**
		 * Who will mentor the team?
		 */
		seniorMentor: MemberReference | null;
		/**
		 * Who coaches the team?
		 */
		seniorCoach: MemberReference | null;
		/**
		 * Visbility of team; each one is described by the enum declaration
		 */
		visiblity: TeamPublicity;
	}

	/**
	 * Allows for teams of cadets
	 */
	export interface TeamObject
		extends NewTeamObject,
			AccountIdentifiable,
			NoSQLDocument {
		/**
		 * Teams use numerical IDs
		 *
		 * Allows for incrementation
		 */
		id: number;
	}
}
