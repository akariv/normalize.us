import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { forkJoin, interval, ReplaySubject, Subscription } from "rxjs";
import { first, switchMap } from "rxjs/operators";
import { ApiService } from "../api.service";
import { OutputMapComponent } from "../output-map/output-map.component";

import * as L from 'leaflet';
import { TSNEOverlay } from "../map/tsne-overlay";
import { ImageFetcherService } from "../image-fetcher.service";
import { GridItem } from "../datatypes";

@Component({
    selector: 'app-installation-base',
    template: ``
})
export class InstallationBase implements AfterViewInit, OnInit, OnDestroy {

    @ViewChild(OutputMapComponent) mapElement: OutputMapComponent;

    map: L.Map;
    tsneOverlay: TSNEOverlay;
    grid = new ReplaySubject<GridItem[]>(1);

    ready = new ReplaySubject<void>(1);
    configuration: any;
    loop: Subscription;

    items: GridItem[] = [];

    constructor(private api: ApiService, private fetchImage: ImageFetcherService) {
        this.api.getMapConfiguration().subscribe((config) => {
            this.configuration = config;
            this.grid.next(this.configuration.grid);
            this.ready.next();
        });
    }

    ngAfterViewInit() {
        this.ready.pipe(
            first(),
        ).subscribe(() => {
            this.createMap();
            this.loop = interval(30000).subscribe(() => {
                // this.loop = interval(5000).subscribe(() => {
                this.fetchLatest();
            });
            this.fetchLatest();
        });
    }

    createMap() {
        this.map = this.mapElement.getMap(this.configuration);
        this.mapElement.feature = 'faces';
        this.tsneOverlay = new TSNEOverlay(this.map, this.grid, this.configuration.dim, this.fetchImage);
        forkJoin(this.items.map((gi) => this.tsneOverlay.addImageLayer(gi.item))).subscribe((gis) => {
            this.items.forEach((gi, i) => {
                gi.pos = gis[i].pos;
            });
        });
    }

    fetchLatest() {
        this.api.getMapConfiguration().pipe(
            switchMap((config: any) => {
                if (config.set !== this.configuration.set) {
                    console.log('SET CHANGED!!!');
                    this.configuration = config;
                    this.grid.next(this.configuration.grid);
                    this.createMap();
                }
                return this.api.getLatest();
            })
        ).subscribe((data) => {
            this.tsneOverlay.addImageLayer(data).subscribe((gi: GridItem) => {
                if (this.items.length > 0) {
                    const pos = this.items[0].pos;
                    this.map.flyTo([-pos.y - 0.5, pos.x + 0.5], this.configuration.max_zoom);
                }
                this.items.unshift(gi);
                if (this.items.length > 7) {
                    const removed = this.items.pop();
                    this.tsneOverlay.removeImageLayer(removed.item);
                }
            });
        });
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.loop.unsubscribe();
    }
}