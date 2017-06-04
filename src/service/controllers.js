import { sendPush } from './util/firebase/firebase.messaging.util';
import { refs } from './util/firebase/firebase.database.util';

const orderCreateController = (msg) => {
  const orderId = msg.id;

  refs.order.root.child(orderId).once('value')
    .then((orderSnap) => {
      const order = orderSnap.val();
      console.log(order);

      let node = null;
      let userDeviceTokenList = [];

      // search node's info
      refs.node.root.child(order.nId).once('value')
        .then((nodeSnap) => {
          node = nodeSnap.val();
          return refs.user.root.once('value');
        })
        .then((userSnap) => {
          const userList = userSnap.val();
          if (userList) {
            userDeviceTokenList = Object.keys(userList)
              .map(key => userList[`${key}`])
              .filter(el => el.dt && el.id !== order.oId)
              .map(el => el.dt);
          }
          return refs.order.dest.child(orderId).once('value');
        })
        .then(destSnap => destSnap.val())
        .then((dest) => {
          const payload = {
            notification: {
              title: `새로운 배달 - ${order.eDP.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${order.curr} `,
              body: `${node.addr} ${node.n} -> ${dest.n1} ${dest.n2 ? dest.n2 : ''}`,
            },
            data: {
              type: 'NEW_ORDER',
              data: order.id
            }
          };

          const options = {
            priority: 'high',
            content_available: true,
            // expire sec
            timeToLive: 60 * 15
          };

          if (userDeviceTokenList.length > 0) {
            sendPush(userDeviceTokenList.length === 1 ? userDeviceTokenList[0] : userDeviceTokenList, payload, options);
          }
        })
        .catch(console.log);
    });
};

const orderCatchController = (msg) => {
  const orderId = msg.id;

  refs.order.root.child(orderId).once('value')
    .then(orderSnap => orderSnap.val())
    .then((order) => {
      refs.user.root.child(order.oId).once('value')
        .then(userSnap => userSnap.val())
        .then((user) => {
          if (user && user.dt) {
            const payload = {
              notification: {
                title: '배달 시작',
                body: `배달 시작!! ${user.n}님이 물건을 구매하기 위해 이동하고 있어요.`,
              },
              data: {
                type: 'CATCH_ORDER',
                data: order.id
              }
            };
            const options = {
              priority: 'high',
              content_available: true,
              // expire sec
              timeToLive: 60 * 15
            };
            sendPush(user.dt, payload, options);
          }
        });
    });
};

const adminApproveRunnerController = (msg) => {
  const userId = msg.id;

  refs.user.root.child(userId).once('value')
    .then(userSnap => userSnap.val())
    .then((user) => {
      if (user && user.dt) {
        const payload = {
          notification: {
            title: '러너 심사 결과',
            body: '축하합니다!! 러너 심사에 통과하여 배달을 시작할 수 있어요. 그런데 잠깐! 배달하기 전 배달방법 및 배달 시 유의사항을 꼭 숙지해야 해요. 그러지 않으면 패널티가 발생될 수 있어요. 자! 그러면 배달을 시작해 볼까요?',
          },
          data: {
            type: 'ADMIN_APPROVE_RUNNER'
          }
        };
        const options = {
          priority: 'high',
          content_available: true,
          // expire sec
          timeToLive: 60 * 15
        };
        sendPush(user.dt, payload, options);
      }
    });
};

const adminDispproveRunnerController = (msg) => {
  const userId = msg.id;

  refs.user.root.child(userId).once('value')
    .then(userSnap => userSnap.val())
    .then((user) => {
      if (user && user.dt) {
        const payload = {
          notification: {
            title: '러너 심사 결과',
            body: '안타깝게도, 러너 심사에서 탈락하셨어요. 재심사 요청은 1주일 뒤부터 가능합니다.',
          },
          data: {
            type: 'ADMIN_DISAPPROVE_RUNNER'
          }
        };
        const options = {
          priority: 'high',
          content_available: true,
          // expire sec
          timeToLive: 60 * 15
        };
        sendPush(user.dt, payload, options);
      }
    });
};

const orderBuyCompleteController = () => {
  console.log('orderBuyComplete');
};
const orderCancelController = () => {
  console.log('orderCancel');
};

export {
  orderCreateController,
  orderCatchController,
  orderBuyCompleteController,
  orderCancelController,
  adminApproveRunnerController,
  adminDispproveRunnerController
};
