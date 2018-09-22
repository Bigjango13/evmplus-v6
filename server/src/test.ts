import { getSession } from '@mysql/xdevapi';
import conf from './conf';
import Account from './lib/Account';
import ProspectiveMember from './lib/members/ProspectiveMember';

const {
	database: schema,
	host,
	password,
	port,
	user
} = conf.database.connection;

getSession({
	host,
	password,
	port,
	user
}).then(async sess => {
	const mysqlSchema = sess.getSchema(schema);

	const newMem: MemberObject = {
		contact: {
			ALPHAPAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			ASSISTANT: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			CADETPARENTEMAIL: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			CADETPARENTPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			CELLPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			DIGITALPAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			EMAIL: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			HOMEFAX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			HOMEPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			INSTANTMESSAGER: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			ISDN: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			RADIO: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			TELEX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			WORKFAX: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
			WORKPHONE: { PRIMARY: '', SECONDARY: '', EMERGENCY: '' }
		},
		dutyPositions: [],
		id: 0,
		memberRank: 'C/AB',
		nameFirst: 'Andrew',
		nameLast: 'Rioux',
		nameMiddle: 'D',
		nameSuffix: '',
		orgid: 916,
		seniorMember: false,
		squadron: 'md089',
		usrID: 'riouxad',
		kind: 'ProspectiveMember'
	};

	const account = await Account.Get('mdx89', mysqlSchema);

	const mem = await ProspectiveMember.Create(newMem, 'appNODE303931', account, mysqlSchema);

	console.log(mem);

	process.exit();
});
