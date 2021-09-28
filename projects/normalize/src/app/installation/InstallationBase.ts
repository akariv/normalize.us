import { AfterViewInit, Component, ViewChild } from "@angular/core";
import { ReplaySubject } from "rxjs";
import { first } from "rxjs/operators";
import { ApiService } from "../api.service";
import { OutputMapComponent } from "../output-map/output-map.component";

import * as L from 'leaflet';

@Component({
    selector: 'app-installation-base',
    template: ``
})
export class InstallationBase implements AfterViewInit{

    @ViewChild(OutputMapComponent) mapElement: OutputMapComponent;

    map: L.Map;

    ready = new ReplaySubject<void>(1);
    configuration: any;

    constructor(private api: ApiService) {
        this.api.getMapConfiguration().subscribe((config) => {
            this.configuration = config;
            this.ready.next();
        });
    }

    ngAfterViewInit() {
        this.ready.pipe(
            first(),
        ).subscribe(() => {
            this.map = this.mapElement.getMap(this.configuration);
            this.mapElement.feature = 'faces';
        });
    }
}