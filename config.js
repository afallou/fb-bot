var config = {
  fbPageToken: process.env['FB_PAGE_TOKEN'],
  eventbriteToken: process.env['EVENTBRITE_PERSONAL_TOKEN'],
  eventbriteApiURL: 'https://www.eventbriteapi.com/v3',
  indeedApiURL: 'http://api.indeed.com',
  indeedPublisherId: process.env['INDEED_PUBLISHER_ID'],
  witaiToken: process.env['WITAI_TOKEN']
};

config.mongoURI = ''


module.exports = config;