import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccounts from '@salesforce/apex/AccountControllerCustom.getAccounts';
import deleteAccount from '@salesforce/apex/AccountControllerCustom.deleteAccount';
import updateAccount from '@salesforce/apex/AccountControllerCustom.updateAccount';
const COLUMNS = [
    {label: 'Name', initialWidth: 300, editable: 'true', fieldName: 'name'},
    {label: 'Rating', initialWidth: 200, editable: 'true', fieldName: 'rating'},
    {label: 'Delete', type: 'customButton', fieldName: 'Id', typeAttributes: {recordId: {fieldName: 'accountId'}}}
]

export default class InlineEditTableDatatable extends LightningElement {
    columns = COLUMNS;
    message = '';
    records;
    refreshedTable;
    firstTimeEdit = true;
    editIcon = 'edit-icon';
    footerState = 'footer-not-visible';
    editedRecordId;
    editedRecordName;
    editedCellValue;
    editedCell; 

    @wire(getAccounts, {})
    wiredAccount(response) {
        this.refreshedTable = response;
        const{data, error} = response;
        if (data) {
            this.records = data;
            this.records = this.records.map( row => {
                return {
                    accountId: row.Id,
                    name: row.Name,
                    rating: (row.Rating === undefined ? '' : row.Rating) 
                }
            })
        }
        if (error) {
            this.message='Data error ' + JSON.stringify(error);
        }
    }

    handleMouseOverIcon(event) {
        let targetId = event.target.dataset.recordid;
        let targetName = event.target.dataset.name;
        if (
            (targetId === this.editedRecordId || this.editedRecordId === undefined) 
            && (targetName === this.editedRecordName || this.editedRecordName === undefined)
            ) {
                this.editIcon = 'edit-icon';
        } else {
            this.editIcon = 'edit-icon-blocked';
        }
    }

    handleEditClick(event) {
        let targetId = event.target.dataset.recordid;
        let targetName = event.target.dataset.name;
        if (
            (targetId === this.editedRecordId || this.editedRecordId === undefined) 
            && (targetName === this.editedRecordName || this.editedRecordName === undefined)
            ) {
                this.editedRecordId = targetId;
                this.editedRecordName = targetName;
                let currentInput;
                let data = this.template.querySelectorAll(`[data-id='${targetId}']`);
                data.forEach((element) => {
                    if(element.dataset.name === targetName) {
                        currentInput = element;
                    }
                });
                currentInput.disabled = '';
                currentInput.focus();
                if (this.firstTimeEdit === true) {
                    this.editedCellValue = event.target.dataset.recordvalue;
                    this.firstTimeEdit = false;
                }
                currentInput.value = this.editedCellValue;
            }
    }

    handleInputBlur(event) {
        let targetId = event.target.dataset.id;
        let targetName = event.target.dataset.name;
        let currentInput;
        let data = this.template.querySelectorAll(`[data-id='${targetId}']`);
                data.forEach((element) =>{
                    if(element.dataset.name === targetName) {
                        currentInput = element;
                    }
                });
        let parent = currentInput.parentNode;
        this.editedCell = currentInput;
        this.editedCellValue = currentInput.value;
        if (currentInput.placeholder !== currentInput.value) {
            currentInput.style.backgroundColor = 'rgb(250, 255, 189)';
            parent.style.backgroundColor = 'rgb(250, 255, 189)';
            this.editIcon = 'edit-icon-blocked';
            this.footerState = 'footer-visible';
        } else {
            currentInput.style.backgroundColor = 'rgb(255, 255, 255)';
            parent.style.backgroundColor = 'rgb(255, 255, 255)';
            this.footerState = 'footer-not-visible';
            this.editIcon = 'edit-icon';
            this.editedRecordId = undefined;
            this.editedRecordName = undefined;
            this.editedCellValue = undefined;
            this.firstTimeEdit = true;
            currentInput.value = '';
        }
    }

    handleClickDelete(event) {
        try {
            deleteAccount({id: event.target.dataset.recordid});
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(this.refreshData.bind(this), 1000);
            const toastEvent = new ShowToastEvent({
                title: 'Account deleted',
                message: 'Record ID: '  + event.target.dataset.recordid,
                variant: 'success'
            });
            this.dispatchEvent(toastEvent);
        }
        catch (e) {
            const toastEvent = new ShowToastEvent({
                title: 'Account was not deleted',
                message: e.name + ': ' + e.message,
                variant: 'error'
            });
            this.dispatchEvent(toastEvent);
            this.message = e;
        }
    }

    handleSaveButtonClick() {
        let accountArray = new Array();
        let account = {'sobjectType': 'Account'};
        account.Id = this.editedRecordId;
        if (this.editedRecordName === 'name') {
            account.Name = this.editedCellValue;
        }
        if (this.editedRecordName === 'rating') {
            account.Rating = this.editedCellValue;
        }
        accountArray[0] = account;
        try {
            updateAccount({accounts: accountArray});
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
        this.editedCell.placeholder = this.editedCellValue;
        this.handleCancelButtonClick();
    }

    handleCancelButtonClick() {
        this.footerState = 'footer-not-visible';
        this.editedRecordId = undefined;
        this.editedRecordName = undefined;
        this.editedCellValue = undefined;
        this.editedCell.value = '';
        this.editedCell.style.backgroundColor = 'rgb(255, 255, 255)';
        let parent = this.editedCell.parentNode;
        parent.style.backgroundColor = 'rgb(255, 255, 255)';
        this.editIcon = 'edit-icon';
        this.editedCell = undefined;
        this.firstTimeEdit = true;
    } 

    refreshData() {
        refreshApex(this.refreshedTable);
    }
}