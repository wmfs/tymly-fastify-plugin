
module.exports = class Walking {
  run (event, context) {
    console.log('LISTENING FOR SOMETHING....')
    event.petDiary.push(`${event.petName} is listening for something... what will ${event.gender === 'male' ? 'he' : 'she'} hear?`)
    context.sendTaskHeartbeat({ petDiary: event.petDiary }, () => { })
  }
}
