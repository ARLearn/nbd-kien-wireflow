// core interfaces here

import { Observable } from 'rxjs';

export type MessageTypeAudioObject = 'org.celstec.arlearn2.beans.generalItem.AudioObject';
export type MessageTypeSingleChoiceImageTest = 'org.celstec.arlearn2.beans.generalItem.SingleChoiceImageTest';
export type MessageTypeMultipleChoiceImageTest = 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceImageTest';
export type MessageTypeNarratorItem = 'org.celstec.arlearn2.beans.generalItem.NarratorItem';
export type MessageTypeMultipleChoiceTest = 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceTest';
export type MessageTypeSingleChoiceTest = 'org.celstec.arlearn2.beans.generalItem.SingleChoiceTest';
export type MessageTypeScanTagTest = 'org.celstec.arlearn2.beans.generalItem.ScanTagTest';
export type MessageTypeVideoObject = 'org.celstec.arlearn2.beans.generalItem.VideoObject';

export interface GameMessageCommon {
  type: MessageTypeAudioObject
    | MessageTypeSingleChoiceImageTest
    | MessageTypeMultipleChoiceImageTest
    | MessageTypeNarratorItem
    | MessageTypeMultipleChoiceTest
    | MessageTypeSingleChoiceTest
    | MessageTypeScanTagTest
    | MessageTypeVideoObject;
  id?: number;
  gameId: number;
  name?: string;
  authoringX?: number;
  authoringY?: number;
  label?: string;
  dependsOn?: Dependency;
  disappearOn?: Dependency;
  richText?: string;
  lastModificationDate?: number;
  lat?: number;
  lng?: number;
  backgroundPath?: Observable<string>;
}


export interface MultipleChoiceScreen extends GameMessageCommon {
  type: MessageTypeMultipleChoiceTest;
  answers?: any[];
  showFeedback?: boolean;
}

export interface MultipleChoiceAnswerItem {
  type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem';
  answer: string;
  id: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface ScanTagScreen extends GameMessageCommon {
  type: MessageTypeScanTagTest;
  autoLaunchQrReader: boolean;
}

export type GameMessage = MultipleChoiceScreen | ScanTagScreen;

export type DependencyTypeProximity = 'org.celstec.arlearn2.beans.dependencies.ProximityDependency';
export type DependencyTypeAction = 'org.celstec.arlearn2.beans.dependencies.ActionDependency';
export type DependencyTypeTime = 'org.celstec.arlearn2.beans.dependencies.TimeDependency';
export type DependencyTypeAnd = 'org.celstec.arlearn2.beans.dependencies.AndDependency';
export type DependencyTypeOr = 'org.celstec.arlearn2.beans.dependencies.OrDependency';

export interface ActionDependency {
  type: DependencyTypeAction;
  action: DependencyTypeAction;
  generalItemId: number;
  scope?: number;
  subtype?: string;
}

export interface AndDependency {
  type: DependencyTypeAnd;
  dependencies: Dependency[];
}

export interface OrDependency {
  type: DependencyTypeOr;
  dependencies: Dependency[];
}

export interface TimeDependency {
  type: DependencyTypeTime;
  timeDelta: number;
  offset: Dependency;
}

export interface ProximityDependency {
  type: DependencyTypeProximity;
  lng: number;
  lat: number;
  radius: number;
}

export type Dependency = AndDependency & OrDependency & TimeDependency & ActionDependency & ProximityDependency;
