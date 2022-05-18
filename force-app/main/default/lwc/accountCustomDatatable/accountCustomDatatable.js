import LightningDatatable from 'lightning/datatable';
import customButton from './customButton.html';
import customEditCell from './customEditCell.html';
import customPicklist from './customPicklist.html';

export default class AccountCustomDatatable extends LightningDatatable {
    static customTypes = {
        customButton: {
            template: customButton,
            typeAttributes: ['recordId']
        },
        customEditCell: {
            template: customEditCell,
            typeAttributes: ['cellValue', 'recordId', 'fieldInfo', 'cellWidth']
        },
        customPicklist: {
            template: customPicklist,
            typeAttributes: ['cellValue', 'recordId', 'fieldInfo']
        }
    }
}