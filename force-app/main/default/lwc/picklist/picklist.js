import { LightningElement, api, wire } from 'lwc';
import { subscribe, publish, MessageContext} from 'lightning/messageService';
import datatableChannel from '@salesforce/messageChannel/Datatable_Channel__c';

export default class Picklist extends LightningElement {
    @api cellValue;
    @api recordId;
    @api fieldInfo;
    editedRecord;
    currentValue;
    currentFieldType;
    editIconStyle = 'edit-icon';
    iconVisibility = 'icon-not-visible';
    disabled = 'disabled';
    cellStyle = 'cell-style-not-editable';
    initialState = true;
    editState;
    iconClicked = false;
    doubleClicked = false;
    hideFooter;
    picklistSet;
    firstTimeEdit = true;
    initialValue;
    editedCellValue;
    
    @wire(MessageContext)
    messageContext;
    
    handleMouseOverCell() {
        this.iconVisibility = 'icon-visible';
        if (
            (this.editedRecord !== this.recordId) && (this.editedRecord !== undefined) 
            || ((this.currentFieldType !== this.fieldInfo) && (this.currentFieldType !==undefined))) {
            this.editState = false;
        } else {
            this.editState = true;
        }
    }

    handleMouseOutCell() {
        this.iconVisibility = 'icon-not-visible';
        this.doubleClicked = false;
    }

    handleClick() {
        if (this.editState) {
            let currentSelect = this.template.querySelector('select');
            this.disabled = '';
            this.cellStyle = 'cell-style-editable';
            if (this.editedRecord !== this.recordId) {
               this.doubleClicked = true;
            }
            this.iconClicked = true;
            currentSelect.focus();
            if (this.firstTimeEdit === true) {
                this.editedCellValue = currentSelect.value;
                this.initialValue = currentSelect.value;
                this.firstTimeEdit = false;
            }
            if (currentSelect.querySelectorAll('option').length === 1) {
                const events = new CustomEvent('demandpicklist', {
                    composed: true,
                    bubbles: true,
                    cancelable: true,
                });
                this.dispatchEvent(events); 
                currentSelect.querySelector('option').remove();
                let defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.innerHTML = '';
                currentSelect.appendChild(defaultOption);
                currentSelect.value = this.editedCellValue;
                for (let i = 0; i < this.picklistSet.length; i++) {
                    let option = document.createElement('option');
                    option.value = this.picklistSet[i];
                    if (this.editedCellValue === this.picklistSet[i]) {
                        option.setAttribute('selected', 'selected');
                    }
                    option.innerHTML = this.picklistSet[i];
                    currentSelect.appendChild(option);
                }
            }
            const payload = {editCellCurentId: this.recordId, cellType: this.fieldInfo};
            publish(this.messageContext, datatableChannel, payload);
        }
    }
    
    handleMouseOverIcon() {
        if (this.editState) {
            this.editIconStyle = 'edit-icon-hover';
            this.disabled = '';
        }
    }

    handleMouseOutIcon() {
        this.editIconStyle = 'edit-icon';
        if (this.iconClicked === false) {
            this.disabled = 'disabled';
        }  
    }

    handleSelectChange(event) {
        this.iconClicked = false;
        if (this.cellValue === event.target.value) {
            this.cellStyle = 'cell-style-not-editable';
            this.template.querySelector('tr').style.backgroundColor = 'rgb(255, 255, 255)';
            const payload = {editCellCurentId: undefined, cellType: undefined};
            publish(this.messageContext, datatableChannel, payload);
            this.hideFooter = true;
            this.cellEdited = false;
        } else {
            this.cellStyle = 'cell-style-changed';
            this.cellEdited = true;
            this.currentValue = event.target.value;
            this.hideFooter = false;
            this.template.querySelector('select').style.backgroundColor = 'rgb(250, 255, 189)';
            this.template.querySelector('tr').style.backgroundColor = 'rgb(250, 255, 189)';
        }
        const events = new CustomEvent('celledit', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {
                hideFooter: this.hideFooter, 
                value: this.currentValue, 
                recordId: this.recordId, 
                fieldInfo: this.fieldInfo
            },
        });
        this.dispatchEvent(events); 
    }

    handleBlurCell(event) {
        if (this.doubleClicked === false) {
            this.disabled = 'disabled';
        }
        if (this.cellValue === event.target.value) {
            const payload = {editCellCurentId: undefined, cellType: undefined};
            publish(this.messageContext, datatableChannel, payload);
            this.firstTimeEdit = true;
        }
    }

    handleRefresh() {
        this.cellStyle = 'cell-style-not-editable';
    }

    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext, 
            datatableChannel, 
            (message) => this.handleMessage(message)
        );
    }

    handleMessage(message) {
        this.picklistSet = message.picklistSet;
        this.currentFieldType = message.cellType;
        if (message.buttonType === 'cancel' || message.buttonType === 'save') {
            this.template.querySelector('tr').style.backgroundColor = 'rgb(255, 255, 255)';
            this.firstTimeEdit = true;
            if (message.buttonType === 'cancel' && this.editedRecord === this.recordId) {
                this.template.querySelector('select').value = this.initialValue;
            }
        }
        this.editedRecord = message.editCellCurentId;
        if (this.editedRecord === undefined) {
            this.cellStyle = 'cell-style-not-editable';
            this.template.querySelector('select').style.backgroundColor = 'rgb(255, 255, 255)';
        }
    }

    connectedCallback() {
        this.subscribeToMessageChannel();
    }
}