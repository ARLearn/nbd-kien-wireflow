export const messagesMock = [{
  type: 'org.celstec.arlearn2.beans.generalItem.VideoObject',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1582210319274,
  id: 5645612305350656,
  scope: 'user',
  name: 'watch this video (if you have both the single and multiple choice correct)',
  description: '',
  autoLaunch: false,
  fileReferences: {
    video: '/game/5634472569470976//Video-3.mp4'
  },
  authoringX: 581.994,
  authoringY: 729.993,
  message: true
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.VideoObject',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1582210308889,
  id: 5651663746498560,
  scope: 'user',
  name: 'titel',
  description: '',
  label: 'test',
  autoLaunch: false,
  fileReferences: {
    video: '/game/5634472569470976//Video-2.mp4'
  },
  authoringX: 251,
  authoringY: 295,
  message: true
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1582209068595,
  id: 5657382461898752,
  scope: 'user',
  name: 'introduction',
  description: 'verder',
  label: 'test',
  autoLaunch: false,
  fileReferences: {
    background: '/game/5634472569470976//background2.jpg'
  },
  richText: 'ga naar de ingang en....',
  authoringX: 880.996,
  authoringY: 615.994,
  message: true
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.VideoObject',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1582209019729,
  id: 5660313307316224,
  scope: 'user',
  name: 'video',
  description: 'verder',
  autoLaunch: false,
  fileReferences: {
    video: '/game/5634472569470976//Video-2.mp4'
  },
  authoringX: 391,
  authoringY: 83,
  message: true
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1582209033967,
  id: 5694038866919424,
  scope: 'user',
  name: 'You found me',
  description: '',
  dependsOn: {
    type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
    action: 'read',
    generalItemId: 5724948068827136
  },
  autoLaunch: false,
  fileReferences: {
    background: '/game/5634472569470976//background.jpg'
  },
  authoringX: 873.994,
  authoringY: 459.999,
  richText: 'You found the QR code and scanned it, now this message is unlocked',
  message: true
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1583839286852,
  id: 5698390272770048,
  scope: 'user',
  name: 'test2',
  description: '',
  autoLaunch: false,
  fileReferences: {
    background: '/game/5634472569470976//background.jpg'
  },
  authoringX: 284.995,
  authoringY: 586.995,
  message: true
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.ScanTag',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1580734759109,
  id: 5724948068827136,
  scope: 'user',
  name: 'Find a QR tag and scan it',
  description: '',
  autoLaunch: false,
  lng: 4.60214213281256,
  lat: 52.00731869088851,
  authoringX: 542,
  authoringY: 447,
  dependsOn: {
    type: 'org.celstec.arlearn2.beans.dependencies.ProximityDependency',
    lat: 1,
    lng: 1,
    radius: 5,
  },
  message: false
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1583156809014,
  id: 5728005179572224,
  scope: 'user',
  name: 'location based',
  description: 'verder',
  autoLaunch: false,
  fileReferences: {
    background: '/game/5634472569470976//background4.jpg'
  },
  richText: 'I will appear when you enter Amsterdam',
  authoringX: 732.988,
  authoringY: 305,
  message: true
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.NarratorItem',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1583839260055,
  id: 5730377779904512,
  scope: 'user',
  name: 'test',
  description: '',
  autoLaunch: false,
  fileReferences: {
    background: '/game/5634472569470976//Schermafbeelding 2020-03-02 om 11.27.10.png'
  },
  authoringX: 1011.991,
  authoringY: 314,
  message: true
}, {
  type: 'org.celstec.arlearn2.beans.generalItem.SingleChoiceTest',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1582211113722,
  id: 5732934090752000,
  scope: 'user',
  name: 'An apple is a',
  description: '',
  autoLaunch: false,
  fileReferences: {
    background: '/game/5634472569470976//background2.jpg'
  },
  authoringX: 970.999,
  authoringY: 47,
  answers: [{
    type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem',
    isCorrect: true,
    feedback: 'well done!',
    answer: 'fruit',
    id: 'u3GLP'
  }, {
    type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem',
    isCorrect: false,
    feedback: 'Nope, try again.',
    answer: 'vegetable',
    id: 'J7CyL'
  }],
  showFeedback: true,
  message: true
},
  {
    type: 'org.celstec.arlearn2.beans.generalItem.SingleChoiceTest',
    gameId: 5634472569470976,
    deleted: false,
    lastModificationDate: 1582211113722,
    id: 5767939090752600,
    scope: 'user',
    name: 'An apple is a',
    description: '',
    dependsOn: {
      type: 'org.celstec.arlearn2.beans.dependencies.AndDependency',
      dependencies: [
        {
          type: 'org.celstec.arlearn2.beans.dependencies.TimeDependency',
          timeDelta: 231000,
          offset: {
            type: 'org.celstec.arlearn2.beans.dependencies.ActionDependency',
            action: 'complete',
            generalItemId: '5651663746498560'
          }
        }
      ]
    },
    autoLaunch: false,
    fileReferences: {
      background: '/game/5634472569470976//background2.jpg'
    },
    authoringX: 970.999,
    authoringY: 47,
    answers: [{
      type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem',
      isCorrect: true,
      feedback: 'well done!',
      answer: 'fruit',
      id: 'u3GLP'
    }, {
      type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem',
      isCorrect: false,
      feedback: 'Nope, try again.',
      answer: 'vegetable',
      id: 'J7CyL'
    }],
    showFeedback: true,
    message: true
  }, {
  type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceTest',
  gameId: 5634472569470976,
  deleted: false,
  lastModificationDate: 1582202136733,
  id: 5738284646924288,
  scope: 'user',
  name: 'What are mammals',
  description: '',
  label: '',
  autoLaunch: false,
  fileReferences: {
    background: '/game/5634472569470976//Schermafbeelding 2020-02-12 om 20.35.00.png'
  },
  authoringX: 633.992,
  authoringY: 20,
  answers: [{
    type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem',
    isCorrect: true,
    feedback: '',
    answer: 'a monkey',
    id: 'T3t8m'
  }, {
    type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem',
    isCorrect: true,
    feedback: '',
    answer: 'a human',
    id: 'MR7Gh'
  }, {
    type: 'org.celstec.arlearn2.beans.generalItem.MultipleChoiceAnswerItem',
    isCorrect: false,
    feedback: '',
    answer: 'salmon',
    id: 'ZqKEy'
  }],
  message: true
}];
