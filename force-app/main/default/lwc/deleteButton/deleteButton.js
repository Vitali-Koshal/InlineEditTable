import { LightningElement, api } from 'lwc';

export default class DeleteButton extends LightningElement {
    @api recordId;

    handleClick() {
        const event = new CustomEvent('deletebuttonclick', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: {recordId: this.recordId},
        });
        this.dispatchEvent(event);
    }
}