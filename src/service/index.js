import {
  startKafkaConsumer,
  consumer,
  messageType,
  topics
} from './util/kafka.util';

import {
  orderCreateController,
  orderCatchController,
  orderBuyCompleteController,
  orderCancelController,
  adminApproveRunnerController,
  adminDispproveRunnerController
} from './controllers';

const topicFunction = {
  ORDER_CREATE: orderCreateController,
  ORDER_CATCH: orderCatchController,
  ORDER_BUY_COMPLETE: orderBuyCompleteController,
  ORDER_CANCEL: orderCancelController,
  ADMIN_APPROVE_RUNNER: adminApproveRunnerController,
  ADMIN_DISAPPROVE_RUNNER: adminDispproveRunnerController,
};

const afterKafkaConsumerStart = () => {
  console.log('push-service consumer start.');
};

const startConsume = () => {
  consumer().on('message', (message) => {
    if (topicFunction[message.topic]) {
      const buf = new Buffer(message.value, 'binary');
      const decodedMessage = messageType.fromBuffer(buf.slice(0));
      topicFunction[message.topic](decodedMessage);
    } else {
      console.error(`unexpected topic ${message.topic} detected..`);
    }
  });
};

const targetTopic = [
  { topic: topics.ORDER_CREATE },
  { topic: topics.ORDER_CATCH },
  { topic: topics.ADMIN_APPROVE_RUNNER },
  { topic: topics.ADMIN_DISAPPROVE_RUNNER }
];

const options = {
  groupId: 'push-service',
  autoCommit: true,
  fetchMaxWaitMs: 1000,
  fetchMaxBytes: 1024 * 1024,
  encoding: 'buffer'
};

startKafkaConsumer(targetTopic, options, afterKafkaConsumerStart);
startConsume();

process.on('SIGINT', () => {
  consumer().close(true, () => {
    console.log('push-service consumer closed.');
    process.exit();
  });
});
