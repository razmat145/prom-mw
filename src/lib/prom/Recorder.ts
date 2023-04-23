
import { Request, Response } from 'express';
import { Registry, Counter, Histogram } from 'prom-client';

import Extractor from './Extractor';

import { defaultLabels } from '../types/Label';
import { IMWOpts } from '../types/Opts';


export class Recorder {

    private registry = new Registry();

    private requestCounter: Counter;
    private requestCounterSuffix = 'requests_total';

    private timingHistogram: Histogram;
    private timingHistogramSuffix = 'request_timing_seconds';

    constructor(mwOpts: IMWOpts) {
        const { appName } = mwOpts;

        this.requestCounter = new Counter({
            name: this.attachBucketPrefix(this.requestCounterSuffix, appName),
            help: 'Total number of requests',
            labelNames: defaultLabels
        });
        this.registry.registerMetric(this.requestCounter);

        this.timingHistogram = new Histogram({
            name: this.attachBucketPrefix(this.timingHistogramSuffix, appName),
            help: 'Request timing in seconds',
            labelNames: defaultLabels,
            registers: [this.registry]
        });
        this.registry.registerMetric(this.timingHistogram);
    }

    public recordRequestStats(req: Request, res: Response, startTiming: [number, number]) {

        const defaultLabels = Extractor.extractDefaultLabels(req, res);
        const timingSeconds = Extractor.extractTimingSeconds(startTiming);

        this.requestCounter.inc(defaultLabels);
        this.timingHistogram.observe(defaultLabels, timingSeconds);
    }

    public getMetrics(): Promise<string> {
        return this.registry.metrics();
    }

    private attachBucketPrefix(bucketName: string, bucketPrefix = '') {
        return bucketPrefix
            ? `${bucketPrefix}_${bucketName}`
            : bucketName;
    }

}