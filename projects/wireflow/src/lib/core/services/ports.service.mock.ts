import { Subject } from 'rxjs';

export class PortsServiceMock {

    private _nodePortNew = new Subject();
    private _nodePortUpdate = new Subject();

    get nodePortNew() { return this._nodePortNew.asObservable(); }
    get nodePortUpdate() { return this._nodePortUpdate.asObservable(); }

    emit_nodePortNew(value) { this._nodePortNew.next(value); }
    emit_nodePortUpdate(value) { this._nodePortUpdate.next(value); }

    createPort() { return Promise.resolve(); }
    updatePort() {}

}
