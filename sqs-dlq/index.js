exports.handler = async function (event, context) {
    for (const record of event.Records) {
        console.log('Record: ', record.body);
    }
}
