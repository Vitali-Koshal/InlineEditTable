import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccounts from '@salesforce/apex/AccountControllerCustom.getAccounts';
import deleteAccount from '@salesforce/apex/AccountControllerCustom.deleteAccount';
import updateAccount from '@salesforce/apex/AccountControllerCustom.updateAccount';
import { publish, MessageContext} from 'lightning/messageService';
import datatableChannel from '@salesforce/messageChannel/Datatable_Channel__c';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import Rating from '@salesforce/schema/Account.Rating';
const COLUMNS = [ 
    {label: 'Name', type: 'customEditCell', initialWidth: 300, editable: 'true', fieldName: 'Name', 
        typeAttributes: {
            cellValue: {fieldName: 'Name'}, 
            recordId: {fieldName: 'accountId'}, 
            fieldInfo: 'name', 
            cellWidth: 'width: 250px;'
        }
    },
    {label: 'Rating', type: 'customPicklist', initialWidth: 200, editable: 'true', fieldName: 'Rating', 
        typeAttributes: {
            cellValue: {fieldName: 'Rating'}, 
            recordId: {fieldName: 'accountId'}, 
            fieldInfo: 'rating', 
        }
    },
    {label: 'Delete', type: 'customButton', fieldName: 'Id', typeAttributes: {recordId: {fieldName: 'accountId'}}}
] 

export default class AccountInlineEditTable extends LightningElement {
    columns = COLUMNS;
    records;
    message;
    refreshedTable;
    currentId;
    fieldInfo;
    fieldValue;
    accountArray = new Array();
    idNumber = 0;
    addNewElement; // check that array for update doesnt have Id that should be updated
    refreshState;
    footerState = 'footer-not-visible';
    ratingsSet = new Array();

    @wire(MessageContext)
    messageContext;

    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: Rating })
    wiredRating(response) {
        const{data, error} = response;
        if (data) {
            data.values.forEach(element => {
                this.ratingsSet.push(element.value);
            })
        }
        if (error) {
            this.message='Data error ' + JSON.stringify(error);
        }
    }

    @wire(getAccounts, {})
    wiredAccount(response) {
        this.refreshedTable = response;
        const{data, error} = response;
        if (data) {
            this.records = data;
            this.records = this.records.map( row => {
                return {
                    accountId: row.Id,
                    Name: row.Name,
                    Rating: (row.Rating === undefined ? '' : row.Rating) 
                }
            })
        }
        if (error) {
            this.message='Data error ' + JSON.stringify(error);
        }
    }
    
    deleteButtonAction(event) {
        try {
            deleteAccount({id: event.detail.recordId});
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(this.refreshData.bind(this), 1000);
            const toastEvent = new ShowToastEvent({
                title: 'Account deleted',
                message: 'Record ID: '  + event.detail.recordId,
                variant: 'success'
            });
            this.dispatchEvent(toastEvent);
        } catch (e) {
            const toastEvent = new ShowToastEvent({
                title: 'Account was not deleted',
                message: e.name + ': ' + e.message,
                variant: 'error'
            });
            this.dispatchEvent(toastEvent);
            this.message = e;
        }
        
    }
    
    handleCellEdit(event) {
        if (event.detail.hideFooter === true ) {
            this.footerState = 'footer-not-visible';
        } else {
            this.footerState = 'footer-visible';
            this.fieldValue = event.detail.value;
            this.currentId = event.detail.recordId;
            this.fieldInfo = event.detail.fieldInfo;
            this.checkForUpdateAccount();
        }
    }

    checkForUpdateAccount() {
        let arraySize = this.accountArray.length;
        if (arraySize === 0) {
            this.addNewElement = true;
        } else {
            for (let i = 0; i < arraySize; i++) {
                if (this.accountArray[i].Id === this.currentId) { //if this record excist just update the fields
                    if (this.fieldInfo === 'name') {
                        this.accountArray[i].Name = this.fieldValue;
                    }
                    if (this.fieldInfo === 'rating') {
                        this.accountArray[i].Rating = this.fieldValue;
                    }
                    this.addNewElement = false;
                    break;
                }
                this.addNewElement = true;
            }
        }
        if (this.addNewElement === true) { //if true create new record for update
            let account = {'sobjectType': 'Account'};
            account.Id = this.currentId;
            if (this.fieldInfo === 'name') {
                account.Name = this.fieldValue;
            }
            if (this.fieldInfo === 'rating') {
                account.Rating = this.fieldValue;
            }
            this.accountArray[this.idNumber] = account;
            this.idNumber = this.idNumber + 1;
        }
    }

    handleSaveButtonClick() {
        try {
            updateAccount({accounts: this.accountArray});
            this.sendMessage('save');
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(this.refreshData.bind(this), 1000);
            this.footerState = 'footer-not-visible';
            const toastEvent = new ShowToastEvent({
                title: 'Account updated',
                variant: 'success'
            });
            this.dispatchEvent(toastEvent);
        }
        catch (e) {
            const toastEvent = new ShowToastEvent({
                title: 'Account was not updated',
                message: e.name + ': ' + e.message,
                variant: 'error'
            });
            this.dispatchEvent(toastEvent);
        }
    }

    handleCancelButtonClick() {
        this.sendMessage('cancel');
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(this.refreshData.bind(this), 1000);
        this.footerState = 'footer-not-visible';
    }

    handleDemandPicklist() {
        const payload = {picklistSet: this.ratingsSet, editCellCurentId: undefined, buttonType: ''};
        publish(this.messageContext, datatableChannel, payload);
    }

    refreshData() {
        refreshApex(this.refreshedTable);
    }

    sendMessage(value) {
        const payload = {picklistSet: this.ratingsSet, editCellCurentId: undefined, buttonType: value};
        publish(this.messageContext, datatableChannel, payload);
    }
}