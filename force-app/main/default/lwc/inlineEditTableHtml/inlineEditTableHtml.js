import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccounts from '@salesforce/apex/AccountControllerCustom.getAccounts';
import deleteAccount from '@salesforce/apex/AccountControllerCustom.deleteAccount';
import updateAccount from '@salesforce/apex/AccountControllerCustom.updateAccount';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import Rating from '@salesforce/schema/Account.Rating';

export default class InlineEditTableDatatable extends LightningElement {
    message;
    records;
    refreshedTable;
    firstTimeEdit = true;
    editIcon = 'edit-icon';
    footerState = 'footer-not-visible';
    editedRecordId;
    editedRecordName;
    editedCellValue;
    initialValue;
    editedCell; 
    ratingsSet = new Array();

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
                    name: row.Name,
                    rating: (row.Rating === undefined ? '' : row.Rating),
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
                    if (element.dataset.name === targetName) {
                        currentInput = element;
                    }
                });
                currentInput.disabled = '';
                currentInput.focus();
                if (this.firstTimeEdit === true) {
                    this.editedCellValue = event.target.dataset.recordvalue;
                    this.initialValue = event.target.dataset.recordvalue;
                    this.firstTimeEdit = false;
                }
                currentInput.value = this.editedCellValue;
            }
    }

    handleEditPicklistClick(event) {
        let targetId = event.target.dataset.recordid;
        let targetName = event.target.dataset.name;
        let targetValue = event.target.dataset.recordvalue;
        if (
            (targetId === this.editedRecordId || this.editedRecordId === undefined) 
            && (targetName === this.editedRecordName || this.editedRecordName === undefined)
            ) {
                this.editedRecordId = targetId;
                this.editedRecordName = targetName;
                let currentInput;
                let data = this.template.querySelectorAll(`[data-id='${targetId}']`);
                data.forEach((element) => {
                    if (element.dataset.name === targetName) {
                        currentInput = element;
                    }
                });
                currentInput.disabled = '';
                currentInput.focus();
                if (this.firstTimeEdit === true) {
                    this.editedCellValue = event.target.dataset.recordvalue;
                    this.initialValue = event.target.dataset.recordvalue;
                    this.firstTimeEdit = false;
                }
                currentInput.value = this.editedCellValue;
                if (currentInput.querySelectorAll('option').length === 1) {
                    currentInput.querySelector('option').remove();
                    let defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.innerHTML = '';
                    currentInput.appendChild(defaultOption);
                    currentInput.value = this.editedCellValue;
                    for (let i = 0; i < this.ratingsSet.length; i++) {
                        let option = document.createElement('option');
                        option.value = this.ratingsSet[i];
                        if (targetValue === this.ratingsSet[i]) {
                            option.setAttribute('selected', 'selected');
                        }
                        option.innerHTML = this.ratingsSet[i];
                        currentInput.appendChild(option);
                    }
                }
            }
    }

    handleSelectChange(event) {
        let targetId = event.target.dataset.id;
        let targetName = event.target.dataset.name;
        let currentInput;
        let data = this.template.querySelectorAll(`[data-id='${targetId}']`);
                data.forEach((element) => {
                    if(element.dataset.name === targetName) {
                        currentInput = element;
                    }
                });
        let parent = currentInput.parentNode;
        this.editedCell = currentInput;
        this.editedCellValue = event.target.value;
        if (this.initialValue !== this.editedCellValue) {
            currentInput.style.backgroundColor = 'rgb(250, 255, 189)';
            parent.style.backgroundColor = 'rgb(250, 255, 189)';
            this.editIcon = 'edit-icon-blocked';
            this.footerState = 'footer-visible';
        } else {
            currentInput.setAttribute('disabled', 'disabled');
            currentInput.style.backgroundColor = 'rgb(255, 255, 255)';
            parent.style.backgroundColor = 'rgb(255, 255, 255)';
            this.footerState = 'footer-not-visible';
            this.editIcon = 'edit-icon';
            this.editedRecordId = undefined;
            this.editedRecordName = undefined;
            this.firstTimeEdit = true;
        }
    }

    handleInputBlur(event) {
        let targetId = event.target.dataset.id;
        let targetName = event.target.dataset.name;
        let currentInput;
        let data = this.template.querySelectorAll(`[data-id='${targetId}']`);
                data.forEach((element) => {
                    if(element.dataset.name === targetName) {
                        currentInput = element;
                    }
                });
        let parent = currentInput.parentNode;
        this.editedCell = currentInput;
        this.editedCellValue = currentInput.value;    
        if (this.initialValue !== this.editedCellValue) {
            currentInput.style.backgroundColor = 'rgb(250, 255, 189)';
            parent.style.backgroundColor = 'rgb(250, 255, 189)';
            this.editIcon = 'edit-icon-blocked';
            this.footerState = 'footer-visible';
        } else {
            currentInput.setAttribute('disabled', 'disabled');
            currentInput.style.backgroundColor = 'rgb(255, 255, 255)';
            parent.style.backgroundColor = 'rgb(255, 255, 255)';
            this.footerState = 'footer-not-visible';
            this.editIcon = 'edit-icon';
            this.editedRecordId = undefined;
            this.editedCellValue = undefined;
            currentInput.value = '';
            this.editedRecordName = undefined;
            this.firstTimeEdit = true;
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

    handleSaveButtonClick() {
        let accountArray = new Array();
        let account = {'sobjectType': 'Account'};
        account.Id = this.editedRecordId;
        if (this.editedRecordName === 'name') {
            account.Name = this.editedCellValue;
        }
        if (this.editedRecordName === 'rating') {
            account.Rating = this.editedCellValue;
            this.editedCell.value = this.editedCellValue;
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
        } catch (e) {
            const toastEvent = new ShowToastEvent({
                title: 'Account was not updated',
                message: e.name + ': ' + e.message,
                variant: 'error'
            });
            this.dispatchEvent(toastEvent);
        }
        if (this.editedRecordName === 'name') {
            this.editedCell.placeholder = this.editedCellValue;
            this.editedCellValue = undefined;
            this.editedCell.value = '';
        } else {
            this.editedCell.value = this.editedCellValue;
        }
        this.resetVariables();
    }

    handleCancelButtonClick() {
        if (this.editedRecordName === 'name') {
            this.editedCellValue = undefined;
            this.editedCell.value = '';
        } else {
            this.editedCell.value = this.initialValue;
        }
        this.resetVariables();
    }

    handleSelectBlur(event) {
        if (this.initialValue === this.editedCellValue) {
            let targetId = event.target.dataset.id;
            let targetName = event.target.dataset.name;
            let currentInput;
            let data = this.template.querySelectorAll(`[data-id='${targetId}']`);
            data.forEach((element) => {
                if(element.dataset.name === targetName) {
                    currentInput = element;
                }
            });
            currentInput.setAttribute('disabled', 'disabled');
            this.editedRecordId = undefined;
            this.editedRecordName = undefined;
            this.firstTimeEdit = true;
        }
    }

    resetVariables() {
        this.editedCell.setAttribute('disabled', 'disabled');
        this.footerState = 'footer-not-visible';
        this.editedRecordId = undefined;
        this.editedRecordName = undefined;
        this.editedCell.style.backgroundColor = 'rgb(255, 255, 255)';
        let parent = this.editedCell.parentNode;
        parent.style.backgroundColor = 'rgb(255, 255, 255)';
        this.editIcon = 'edit-icon';
        this.firstTimeEdit = true;
        this.editedCell = undefined;
    }

    refreshData() {
        refreshApex(this.refreshedTable);
    }
}