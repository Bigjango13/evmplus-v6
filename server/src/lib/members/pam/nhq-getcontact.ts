import { load } from 'cheerio';
import { MemberContact, MemberContactPriority, MemberContactType } from '../../../types';
import req from './nhq-request';

export default async (cookie: string): Promise<MemberContact> => {
	const contact: MemberContact = {
		ALPHAPAGER : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		ASSISTANT : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CADETPARENTEMAIL : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CADETPARENTPHONE : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		CELLPHONE : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		DIGITALPAGER : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		EMAIL : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		HOMEFAX : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		HOMEPHONE : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		INSTANTMESSAGER : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		ISDN : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		RADIO : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		TELEX : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		WORKFAX : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' },
		WORKPHONE : { PRIMARY: '', SECONDARY: '', EMERGENCY: '' }
	};

	const page = await req('/CAP.eServices.Web/MyAccount/ContactInfo.aspx', cookie);

	const $ = load(page);

	const table = $('#gvContactInformation');

	table.find('tr').each(function () {
		const texts = $(this).children().map(function (i: number, el: CheerioElement) {
			return $(this).text().replace(/[ \n\r]/g, '');
		}).get();

		if (texts[0].indexOf('PHONE') > -1) {
			texts[2] = texts[2].replace(/[\(\) -]/g, '');
		}

		if (texts[4] === 'False' || texts[4] === '') {
			contact
			[
				texts[0] as MemberContactType
			][
				texts[1] as MemberContactPriority
			] = texts[2];
		}
	});

	return contact;
};