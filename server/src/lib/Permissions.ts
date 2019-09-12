import { MemberPermissions } from 'common-lib';

export const Member: Readonly<MemberPermissions> = {
	AddEvent: 0,
	AdministerPT: 0,
	AssignTasks: 0,
	DownloadStaffGuide: 0,
	FileManagement: 0,
	FlightAssign: 0,
	MusterSheet: 0,
	PTSheet: 0,
	PromotionManagement: 0,

	AddTeam: 0,
	AssignTemporaryDutyPositions: 0,
	CopyEvent: 0,
	DeleteEvent: 0,
	EditEvent: 0,
	EditTeam: 0,
	EventContactSheet: 0,
	EventLinkList: 0,
	EventStatusPage: 0,
	ORMOPORD: 0,
	ProspectiveMemberManagment: 0,
	ManageBlog: 0,
	SignUpEdit: 0,
	CreateNotifications: 0,

	DownloadCAPWATCH: 0,
	PermissionManagement: 0,
	RegistryEdit: 0
};

export const Staff: Readonly<MemberPermissions> = {
	AddEvent: 1,
	AdministerPT: 1,
	AssignTasks: 1,
	DownloadStaffGuide: 1,
	FileManagement: 1,
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,

	AddTeam: 0,
	AssignTemporaryDutyPositions: 0,
	CopyEvent: 0,
	DeleteEvent: 0,
	EditEvent: 0,
	EditTeam: 0,
	EventContactSheet: 0,
	EventLinkList: 0,
	EventStatusPage: 0,
	ORMOPORD: 0,
	ProspectiveMemberManagment: 0,
	ManageBlog: 0,
	SignUpEdit: 0,
	CreateNotifications: 0,

	DownloadCAPWATCH: 0,
	PermissionManagement: 0,
	RegistryEdit: 0
};

export const Manager: Readonly<MemberPermissions> = {
	AddEvent: 2,
	AdministerPT: 1,
	AssignTasks: 1,
	DownloadStaffGuide: 1,
	FileManagement: 1,
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,

	AddTeam: 1,
	AssignTemporaryDutyPositions: 1,
	CopyEvent: 1,
	DeleteEvent: 1,
	EditEvent: 1,
	EditTeam: 1,
	EventContactSheet: 1,
	EventLinkList: 1,
	EventStatusPage: 1,
	ORMOPORD: 1,
	ProspectiveMemberManagment: 1,
	ManageBlog: 1,
	SignUpEdit: 1,
	CreateNotifications: 1,

	DownloadCAPWATCH: 0,
	PermissionManagement: 0,
	RegistryEdit: 0
};

export const Admin: Readonly<MemberPermissions> = {
	AddEvent: 2,
	AdministerPT: 1,
	AssignTasks: 1,
	DownloadStaffGuide: 1,
	FileManagement: 1,
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,

	AddTeam: 1,
	AssignTemporaryDutyPositions: 1,
	CopyEvent: 1,
	DeleteEvent: 1,
	EditEvent: 1,
	EditTeam: 1,
	EventContactSheet: 1,
	EventLinkList: 1,
	EventStatusPage: 1,
	ORMOPORD: 1,
	ProspectiveMemberManagment: 1,
	ManageBlog: 1,
	SignUpEdit: 1,
	CreateNotifications: 1,

	DownloadCAPWATCH: 1,
	PermissionManagement: 1,
	RegistryEdit: 1
};