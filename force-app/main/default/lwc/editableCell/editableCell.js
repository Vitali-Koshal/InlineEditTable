import { LightningElement, api, wire } from 'lwc';
import { subscribe, publish, MessageContext} from 'lightning/messageService';
import datatableChannel from '@salesforce/messageChannel/Datatable_Channel__c';

export default class EditableCell extends LightningElement {
    @api cellValue;
    @api recordId;
    @api fieldInfo;
    @api cellWidth;
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
    @wire(MessageContext)
    messageContext;
    
    
    handleMouseOverCell() {
        this.iconVisibility = 'icon-visible';
        if ((this.editedRecord !== this.recordId) && (this.editedRecord !== undefined) || ((this.currentFieldType !== this.fieldInfo) && (this.currentFieldType !==undefined))) {
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
            this.disabled = '';
            this.cellStyle = 'cell-style-editable';
            if (this.editedRecord !== this.recordId) {
                this.doubleClicked = true;
            }
            this.iconClicked = true;
            if (this.initialState === true) {
                if (this.cellValue === undefined) {
                    this.template.querySelector('input').value = '';
                } else {
                    this.template.querySelector('input').value = this.cellValue;
                }
                this.currentValue = this.cellValue;
                this.initialState = false;
            }
            this.template.querySelector('input').focus();
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

    handleBlur(event) {
        if (this.doubleClicked === false) {
            this.disabled = 'disabled';
        }
        this.iconClicked = false;
        if (this.cellValue === event.target.value) {
            this.cellStyle = 'cell-style-not-editable';
            const payload = {editCellCurentId: undefined, cellType: undefined};
            publish(this.messageContext, datatableChannel, payload);
            this.hideFooter = true;
        } else {
            this.cellStyle = 'cell-style-changed';
            this.currentValue = event.target.value;
            this.hideFooter = false;
        }
        const events = new CustomEvent('celledit', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {hideFooter: this.hideFooter, value: this.currentValue, recordId: this.recordId, fieldInfo: this.fieldInfo},
        });
        this.dispatchEvent(events); 
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
        this.editedRecord = message.editCellCurentId;
        this.currentFieldType = message.cellType;
        if (this.editedRecord === undefined) {
            this.cellStyle = 'cell-style-not-editable';
        }
        if (message.buttonType === 'cancel') {
            this.template.querySelector('input').value = this.cellValue;
        }
    }

    connectedCallback() {
        this.subscribeToMessageChannel();
    }
}