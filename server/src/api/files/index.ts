import * as bodyParser from 'body-parser';
import * as express from 'express';
import { join } from 'path';
import conf from '../../conf';
import Account from '../../lib/Account';
import Member from '../../lib/members/NHQMember';
import { getSchemaValidator } from '../../lib/Util';
// Children methods
import getfiles from './children/getfiles';
import insertchild from './children/insertchild';
import removefile from './children/removefile';
// File methods
import createfolder from './files/createfolder';
import deletefile from './files/deletefile';
import fileinfo from './files/fileinfo';
import upload from './files/fileupload';
import getfile from './files/getfile';
import setfiledata from './files/setfiledata';
import setfileinfo from './files/setfileinfo';

// tslint:disable-next-line:no-var-requires
const fileObjectSchema = require(join(conf.schemaPath, 'FileObject.json'));

const fileValidator = getSchemaValidator(fileObjectSchema);

const fileObjectValidator = (val: any): val is FileObject =>
	fileValidator(val) as boolean;

export type FileObjectValidator = typeof fileObjectValidator;

const filerouter: express.Router = express.Router();

filerouter.use(Account.ExpressMiddleware);
filerouter.use(Member.ExpressMiddleware);

// Only client will need this, but I'm going to make files a folder with a MIME type of application/folder

/// https://developers.google.com/drive/v2/reference/files#methods
// The following two have to be first, as they can't have bodyParser taking the data
// and ending the data stream
filerouter.post('/upload', upload); // insert
filerouter.put('/upload/:fileid', setfiledata); // update
filerouter.use(bodyParser.json());
filerouter.get('/:fileid', fileinfo); // get
filerouter.get('/:fileid/export', getfile); // export, functions differently and downloads data for file
filerouter.delete('/:fileid', deletefile); // delete
filerouter.put('/:fileid', setfileinfo(fileObjectValidator)); // update
filerouter.post('/create/:name', createfolder);

/// https://developers.google.com/drive/v2/reference/children#methods
filerouter.delete('/:parentid/children/:childid', removefile); // delete
filerouter.post('/:parentid/children', insertchild); // insert
filerouter.get('/:parentid/children', getfiles);

export default filerouter;
