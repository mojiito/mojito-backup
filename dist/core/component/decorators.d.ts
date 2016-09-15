import { ChangeDetectionStrategy } from '../change_detection/change_detection';
export interface ComponentMetadataFactory {
    (metadata: {
        changeDetection?: ChangeDetectionStrategy;
        selector?: string;
        inputs?: string[];
        outputs?: string[];
        events?: string[];
        host?: {
            [key: string]: string;
        };
        providers?: any[];
        templateUrl?: string;
        template?: string;
        styleUrls?: string[];
        styles?: string[];
    }): ClassDecorator;
}
export declare var Component: ComponentMetadataFactory;
