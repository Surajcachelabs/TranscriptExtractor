const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const MODEL_ID = 'ft:gpt-4o-mini-2024-07-18:cache-labs-llc:csm-audit:Cich3dyr';

async function scoreTranscript(transcriptText) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is missing.');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: MODEL_ID,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are a grader. Given a transcript, return numeric marks out of 100 and a brief rationale. Respond in JSON: {"marks": number, "rationale": string}.',
      },
      { role: 'user', content: transcriptText },
    ],
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    return { raw: undefined };
  }

  try {
    const parsed = JSON.parse(reply);
    return {
      marks: typeof parsed.marks === 'number' ? parsed.marks : undefined,
      rationale: typeof parsed.rationale === 'string' ? parsed.rationale : undefined,
      raw: reply,
    };
  } catch (_err) {
    // If not valid JSON, return raw
    return { raw: reply };
  }
}

const transcript = {
  "text": "How are you? Hey, good, good, good. How are you? I'm also good. Thank you for asking. Sorry, I need to reschedule this from yesterday. No problem, Aditya. No problem. Yeah, yeah, Aditya, while we were talking in the previous call, I just want to take some insights on the concept. You were saying you can give some topics. So I told you to provide me with a few topics which are related to your field so that I can generate more topics for you. So do you have those few topics with you which are similar to your field and on which you are going to write your papers so that I can understand what topics you really need from my end? Yeah, majorly implementation of CRM and in several sectors, maybe like finance or. Give me the keywords here. This one is OK. Give me a few keywords which are related to your field. And right now, I'll give you those topics. OK, OK. OK. And also, how's your day going? Yeah, I have been busy. It's actually like we have collected this data from 8 to 11. I love back-to-back calls. I'll get free from 12 and again from 2 o'clock again, back-to-back. So yeah, a little busy. The whole working day should be a little busy. Wednesday is feeling like Monday. Yeah, like other than maybe until Thursday, we'll have this prolonged schedule. And Friday is a little bit OK, OK. Like we'll not have regular calls on Friday. Yeah, Friday is OK. Oh, and then weekend? Yeah, weekend as usual. It'll just pass by. It doesn't stay long. Sorry? And then again, Monday will come. Yeah, yeah, practically, yeah. Mine also going well. Today was a work-from-home day. Tomorrow again, back to office. Oh, OK, OK, OK. So where are you basically from? Our office is here in Delhi. Oh, Delhi, OK, OK. Yes. So any approvals recently? Yeah, today only we received one approval. Great, great, great, great. Like unfortunately, the client got an RFE before. Oh, OK, before. And now they filed their response for it, and they got the approval today only. I think it's one hour before they messaged us. The I-140 is approved. Great, great, great, great. Nice, nice, good to know. Yeah. Sales was an implementation, implementation of CRM. Oh, yeah. And also maybe some AI related to CRM. Let me check your niche. Also, like your month payment is also pending from Feb 23rd. One second. And also, our team gave you three niches. So out of those three, let me share my screen, and you can see it there. Yeah, this one. Let me know once you can see my screen. Yes, I can. So these were the niches which were provided to you from our team's end. So out of these three, which one is the most relevant to you? Like these are more or less same, but different versions of the same. I think it's the same. I think they're all same. Yeah, all three are same. I think so. Then multiple duplicate things are pasted once. yeah so you want me to so you suggest me to copy paste this no problem i i'll use what you call i'll use this okay and are you giving me the keywords i have three for now implementation of crm ai implementation in crm salesman implementation yeah yeah maybe for now we can maybe start with this one like at least i'll get few now i'll going through i'll much more yeah okay that's it okay implementation of crm sales force okay okay okay so chat jeopardy is giving me a few topics i am sharing it with you yeah so one one section is for crm and sales for implementation tools so this one have a look these are it related to crm okay then these are related to ai and then cloud data engineering 6 6 12 plus 8 18 yeah then 20 20 topics or do you need something else or for else you can give me words so i'm i'll give you a bit these are a lot yeah sorry i was telling do you need a few one two liner explanation for these topics also so that you can get the gist of what you need to write here or this is enough yeah yeah yeah anything it could be so you use you're using chatgp only even for that or yeah chatgp only that the basic chatgp okay okay so in in in all your whomever you are a csm so what is the usual time period or time frame you know like usually people take like any any random any random period you saw any a similar pattern you saw? For writing all that 20 papers? Not just the papers, I'm talking about the whole journey. Yeah, maybe papers too. In my hand, I have seen people first, because most of the people here don't have experience of writing papers. So but when they get their hands on and it's easy for them to move with other tasks. So parallelly, they complete multiple things. So we will also follow the same pattern, which I have been following for the other clients as well. And it has helped us to go to the attorney's cage really quick. So what we can do here is, first, we will get our hands on this paper writing. When this thing becomes easy for us, then we will move to other steps. And we can parallelly work on multiple things. So we can start working on the press, start working on the letters. Because I'll create a separate ticket for you for the OC letters, which will be for the papers. And for the critical role, which will be collecting for the workplace projects from the current company, as well as for a previous company. What we have to do there is, there will be a question. You just need to answer those questions. And our team will draft those letters for you. So you just need to give us the answer. And rest, you can take your rest of the time to focus on other tasks. Same goes for the press also. You need to give us the answer. Team will draft an article. We'll review the article. If it requires any modification, the team know why our comments. Work on it in the back end. And rest, you can focus on the other tasks. Right, right, right, got it, got it, got it, OK. It won't take, like, too much time. OK. I'm giving you the explanation also here. Where is it? Yep. See. OK. And one of my clients shared a website with me for writing the papers. I'm sharing it with you. You can just explore and see whether this works for you or not, see? Yeah, yeah, yeah, for sure. Is this also a part or just a regular? Yeah. It's a different website which uses AI for writing the papers. So you can try and see whether they write the paper good or not. And, Aditya, once I'm done with one, for example, like I'm done, I'm for sure I'll try to sit these four days and I'll try to publish something by this weekend. So can I directly copy-paste in this WhatsApp group the paper, whichever I write, for your review? Instead, the best way here will be you use Google Docs to write your paper. There you paste all the content. And then share that Google Doc with me. Provide me the link of that Google Doc. And it will be easy for me to highlight the section where it requires changes, or I can leave comments easily there. And you can review those comments, make edited changes, and then I will again check back. So it will be easy for us. It will save us time for too much back and forth. But if you share the Doc with me on WhatsApp, like the Doc version, then I have to open the Doc, download the Doc, and then I will have to type SMS to you explaining all this. Sure, sure, sure, sure. Got it, got it, got it. So work on the Google Doc thing. You can create a ticket, or you can directly provide me with the link of that. And I can leave my comments there. And it will be easy for us. OK, OK, got it, got it. Yeah, sure, Aritja. With this, I'll at least try to target one by this weekend. I know you can do it. Like, I 100% know, and I can take the guarantee that you can definitely do this. This is not something like a neuroscience engineering thing, which is very much complicated. I didn't know all these tools. I was simply taking some feedback. back in the Google, and I was writing on my own. Yeah, yeah, yeah. That is a long process. That is too much. Yeah. That's why I was like, I was after seeing all the reviews, I had to pick every, when I went through some sample of this, there was also some links where they got it. So I was like shocked, like whether I can put these or not. So I was a little stuck there, and I couldn't do any progress. But yeah, I'll try to at least target one at least by this weekend for your review. Yeah, we will take small step. There is nothing to hurry. Just follow the structure which I have shared with you. This is the structure which things we need in the paper. Whenever you are struck somewhere, whenever you are like that I'm in a rabbit hole, I can't move anywhere now, just ping me, give me a call. I'll be there to help you out. Yeah, yeah, yeah, sure. And then this payment also I'll complete. I'll complete the recharges. I didn't open this well. But yeah, I'll complete this too. Yeah, yeah, sure. Yeah, for sure, for sure. I think I paid 90% just this is remaining, but I'll pay it off. Yeah, the second installment is only. Yeah, yeah, this is the last one. I paid 85% almost. Yeah, yeah, you are almost on time. I paid almost 90% just this one. I'll pay, I'll complete this too. Yeah, yeah, sure, sure, sure. And this was one of the tool like people use more tools. Basically, mostly they focus on the chat GPT and other things to write the papers. And if they are generated by them, they add their own touch to it live. Because mostly what AI tools does is like they give the references of online articles. But what you can do is you can scrape the website online and find a few papers which are related to your field. And cite those papers topics within your paper. OK, OK. And give proper citations. In this way, you will increase the references also. And the citation within the content will make it more legitimate also. And it will give you more personal touch and it will humanize your content more. OK, got it, got it. Yeah, yeah. Sure, I'll do it. Yeah, thank you. Thank you for providing this, Blainley. I think this is really good too. Yeah, yeah. I'll try. And if I find any other tools from here, if I have something anywhere in my inbox, I'll definitely send it to you. It will help you a lot. OK, OK. Sure, Aditya. Thank you, thank you very much. Anything else you need from my end? No, no, Aditya. This is a big help. And I can at least start something confident now. Yeah, yeah. And also, are you working on the rest of the tickets, like the opportunities one? Oh, the team has not assigned you the opportunities? No, no, Aditya. In the very initially, I was assigned all the tickets. I given all the responses I could. And that's it. That's the done. Nothing, no to and fro, nothing till today. Nothing, no, no. Just that compensation one is what they have figured out that I'm unfit for that. But other than that, I don't have any update on anything. I think so. Like, we should not worry too much, because I'll take care of the rest of the thing. Just like, let's complete the first draft. And then we will move on to the next step when you get more confident on the process. And things will become easier for you. We will start working on multiple things. Yeah, yeah, yeah. Sure, Aditya. Yeah, yeah. And no worries. Don't be nervous or anything. Yeah, yeah. Yeah, sure, sure. Thank you very much. Thank you. OK, but thank you for your time, Gita. Have a nice day. Bye, Aditya. I will bring you back, yeah. Yeah, yeah, sure, sure. Bye, bye. Thank you. Have a good night. Bye. Bye.",
  "language": "english",
  "duration": 1160.4300231933594,
  "segments": [
    {
      "id": 0,
      "start": 0,
      "end": 1.159999966621399,
      "text": " How are you?"
    },
    {
      "id": 1,
      "start": 1.159999966621399,
      "end": 2.119999885559082,
      "text": " Hey, good, good, good."
    },
    {
      "id": 2,
      "start": 2.119999885559082,
      "end": 2.7200000286102295,
      "text": " How are you?"
    },
    {
      "id": 3,
      "start": 2.7200000286102295,
      "end": 3.359999895095825,
      "text": " I'm also good."
    },
    {
      "id": 4,
      "start": 3.359999895095825,
      "end": 4.320000171661377,
      "text": " Thank you for asking."
    },
    {
      "id": 5,
      "start": 4.320000171661377,
      "end": 7.639999866485596,
      "text": " Sorry, I need to reschedule this from yesterday."
    },
    {
      "id": 6,
      "start": 7.639999866485596,
      "end": 8.760000228881836,
      "text": " No problem, Aditya."
    },
    {
      "id": 7,
      "start": 8.760000228881836,
      "end": 9.680000305175781,
      "text": " No problem."
    },
    {
      "id": 8,
      "start": 9.680000305175781,
      "end": 12.880000114440918,
      "text": " Yeah, yeah, Aditya, while we were"
    },
    {
      "id": 9,
      "start": 12.880000114440918,
      "end": 18.760000228881836,
      "text": " talking in the previous call, I just"
    },
    {
      "id": 10,
      "start": 18.760000228881836,
      "end": 21.8799991607666,
      "text": " want to take some insights on the concept."
    },
    {
      "id": 11,
      "start": 21.8799991607666,
      "end": 26.079999923706055,
      "text": " You were saying you can give some topics."
    },
    {
      "id": 12,
      "start": 26.079999923706055,
      "end": 34.79999923706055,
      "text": " So I told you to provide me with a few topics which"
    },
    {
      "id": 13,
      "start": 34.79999923706055,
      "end": 37.880001068115234,
      "text": " are related to your field so that I can generate more"
    },
    {
      "id": 14,
      "start": 37.880001068115234,
      "end": 38.63999938964844,
      "text": " topics for you."
    },
    {
      "id": 15,
      "start": 38.63999938964844,
      "end": 41.08000183105469,
      "text": " So do you have those few topics with you"
    },
    {
      "id": 16,
      "start": 41.08000183105469,
      "end": 43.91999816894531,
      "text": " which are similar to your field and on which you"
    },
    {
      "id": 17,
      "start": 43.91999816894531,
      "end": 48.119998931884766,
      "text": " are going to write your papers so that I can understand what"
    },
    {
      "id": 18,
      "start": 48.119998931884766,
      "end": 49.959999084472656,
      "text": " topics you really need from my end?"
    },
    {
      "id": 19,
      "start": 56.08000183105469,
      "end": 69.5199966430664,
      "text": " Yeah, majorly implementation of CRM and in several sectors,"
    },
    {
      "id": 20,
      "start": 69.5199966430664,
      "end": 73.87999725341797,
      "text": " maybe like finance or."
    },
    {
      "id": 21,
      "start": 73.87999725341797,
      "end": 76.04000091552734,
      "text": " Give me the keywords here."
    },
    {
      "id": 22,
      "start": 76.04000091552734,
      "end": 77.31999969482422,
      "text": " This one is OK."
    },
    {
      "id": 23,
      "start": 77.31999969482422,
      "end": 80,
      "text": " Give me a few keywords which are related to your field."
    },
    {
      "id": 24,
      "start": 80,
      "end": 83.68000030517578,
      "text": " And right now, I'll give you those topics."
    },
    {
      "id": 25,
      "start": 83.68000030517578,
      "end": 84.31999969482422,
      "text": " OK, OK."
    },
    {
      "id": 26,
      "start": 87.08000183105469,
      "end": 87.55999755859375,
      "text": " OK."
    },
    {
      "id": 27,
      "start": 92.36000061035156,
      "end": 94.5999984741211,
      "text": " And also, how's your day going?"
    },
    {
      "id": 28,
      "start": 94.5999984741211,
      "end": 96.4000015258789,
      "text": " Yeah, I have been busy."
    },
    {
      "id": 29,
      "start": 96.4000015258789,
      "end": 100.83999633789062,
      "text": " It's actually like we have collected this data from 8 to 11."
    },
    {
      "id": 30,
      "start": 100.83999633789062,
      "end": 102.95999908447266,
      "text": " I love back-to-back calls."
    },
    {
      "id": 31,
      "start": 102.95999908447266,
      "end": 105.83999633789062,
      "text": " I'll get free from 12 and again from 2 o'clock again,"
    },
    {
      "id": 32,
      "start": 105.83999633789062,
      "end": 107,
      "text": " back-to-back."
    },
    {
      "id": 33,
      "start": 107,
      "end": 109.19999694824219,
      "text": " So yeah, a little busy."
    },
    {
      "id": 34,
      "start": 109.19999694824219,
      "end": 111.87999725341797,
      "text": " The whole working day should be a little busy."
    },
    {
      "id": 35,
      "start": 111.87999725341797,
      "end": 114.16000366210938,
      "text": " Wednesday is feeling like Monday."
    },
    {
      "id": 36,
      "start": 114.19999694824219,
      "end": 117.5999984741211,
      "text": " Yeah, like other than maybe until Thursday,"
    },
    {
      "id": 37,
      "start": 117.5999984741211,
      "end": 120.31999969482422,
      "text": " we'll have this prolonged schedule."
    },
    {
      "id": 38,
      "start": 120.31999969482422,
      "end": 122.44000244140625,
      "text": " And Friday is a little bit OK, OK."
    },
    {
      "id": 39,
      "start": 122.44000244140625,
      "end": 125.27999877929688,
      "text": " Like we'll not have regular calls on Friday."
    },
    {
      "id": 40,
      "start": 125.27999877929688,
      "end": 127.5199966430664,
      "text": " Yeah, Friday is OK."
    },
    {
      "id": 41,
      "start": 127.5199966430664,
      "end": 130.83999633789062,
      "text": " Oh, and then weekend?"
    },
    {
      "id": 42,
      "start": 130.83999633789062,
      "end": 132.24000549316406,
      "text": " Yeah, weekend as usual."
    },
    {
      "id": 43,
      "start": 132.24000549316406,
      "end": 135.44000244140625,
      "text": " It'll just pass by."
    },
    {
      "id": 44,
      "start": 135.44000244140625,
      "end": 136.72000122070312,
      "text": " It doesn't stay long."
    },
    {
      "id": 45,
      "start": 141.9199981689453,
      "end": 142.72000122070312,
      "text": " Sorry?"
    },
    {
      "id": 46,
      "start": 142.75999450683594,
      "end": 144.8800048828125,
      "text": " And then again, Monday will come."
    },
    {
      "id": 47,
      "start": 144.8800048828125,
      "end": 149.72000122070312,
      "text": " Yeah, yeah, practically, yeah."
    },
    {
      "id": 48,
      "start": 149.72000122070312,
      "end": 151.1199951171875,
      "text": " Mine also going well."
    },
    {
      "id": 49,
      "start": 151.1199951171875,
      "end": 153.47999572753906,
      "text": " Today was a work-from-home day."
    },
    {
      "id": 50,
      "start": 153.47999572753906,
      "end": 156.24000549316406,
      "text": " Tomorrow again, back to office."
    },
    {
      "id": 51,
      "start": 156.24000549316406,
      "end": 158.9199981689453,
      "text": " Oh, OK, OK, OK."
    },
    {
      "id": 52,
      "start": 158.9199981689453,
      "end": 162.36000061035156,
      "text": " So where are you basically from?"
    },
    {
      "id": 53,
      "start": 162.36000061035156,
      "end": 165.16000366210938,
      "text": " Our office is here in Delhi."
    },
    {
      "id": 54,
      "start": 165.16000366210938,
      "end": 166.63999938964844,
      "text": " Oh, Delhi, OK, OK."
    },
    {
      "id": 55,
      "start": 166.63999938964844,
      "end": 168.39999389648438,
      "text": " Yes."
    },
    {
      "id": 56,
      "start": 168.39999389648438,
      "end": 172.36000061035156,
      "text": " So any approvals recently?"
    },
    {
      "id": 57,
      "start": 172.36000061035156,
      "end": 175.16000366210938,
      "text": " Yeah, today only we received one approval."
    },
    {
      "id": 58,
      "start": 175.16000366210938,
      "end": 176.75999450683594,
      "text": " Great, great, great, great."
    },
    {
      "id": 59,
      "start": 176.75999450683594,
      "end": 181.27999877929688,
      "text": " Like unfortunately, the client got an RFE before."
    },
    {
      "id": 60,
      "start": 181.27999877929688,
      "end": 184.32000732421875,
      "text": " Oh, OK, before."
    },
    {
      "id": 61,
      "start": 184.32000732421875,
      "end": 187.0800018310547,
      "text": " And now they filed their response for it,"
    },
    {
      "id": 62,
      "start": 187.0800018310547,
      "end": 189.67999267578125,
      "text": " and they got the approval today only."
    },
    {
      "id": 63,
      "start": 189.67999267578125,
      "end": 192.8000030517578,
      "text": " I think it's one hour before they messaged us."
    },
    {
      "id": 64,
      "start": 192.8000030517578,
      "end": 195.9199981689453,
      "text": " The I-140 is approved."
    },
    {
      "id": 65,
      "start": 195.9199981689453,
      "end": 198.8800048828125,
      "text": " Great, great, great, great."
    },
    {
      "id": 66,
      "start": 198.8800048828125,
      "end": 200.72000122070312,
      "text": " Nice, nice, good to know."
    },
    {
      "id": 67,
      "start": 200.72000122070312,
      "end": 201.22000122070312,
      "text": " Yeah."
    },
    {
      "id": 68,
      "start": 207.44000244140625,
      "end": 211.0399932861328,
      "text": " Sales was an implementation, implementation of CRM."
    },
    {
      "id": 69,
      "start": 211.0399932861328,
      "end": 212.32000732421875,
      "text": " Oh, yeah."
    },
    {
      "id": 70,
      "start": 212.32000732421875,
      "end": 216.60000610351562,
      "text": " And also maybe some AI related to CRM."
    },
    {
      "id": 71,
      "start": 221.60000610351562,
      "end": 224.67999267578125,
      "text": " Let me check your niche."
    },
    {
      "id": 72,
      "start": 224.67999267578125,
      "end": 228.63999938964844,
      "text": " Also, like your month payment is also pending from Feb 23rd."
    },
    {
      "id": 73,
      "start": 231.72000122070312,
      "end": 232.72000122070312,
      "text": " One second."
    },
    {
      "id": 74,
      "start": 249.1999969482422,
      "end": 251.63999938964844,
      "text": " And also, our team gave you three niches."
    },
    {
      "id": 75,
      "start": 251.63999938964844,
      "end": 254.52000427246094,
      "text": " So out of those three, let me share my screen,"
    },
    {
      "id": 76,
      "start": 254.52000427246094,
      "end": 256.0799865722656,
      "text": " and you can see it there."
    },
    {
      "id": 77,
      "start": 256.239990234375,
      "end": 258.1199951171875,
      "text": " Yeah, this one."
    },
    {
      "id": 78,
      "start": 258.1199951171875,
      "end": 261.3999938964844,
      "text": " Let me know once you can see my screen."
    },
    {
      "id": 79,
      "start": 261.3999938964844,
      "end": 262.8399963378906,
      "text": " Yes, I can."
    },
    {
      "id": 80,
      "start": 262.8399963378906,
      "end": 266.3999938964844,
      "text": " So these were the niches which were provided to you"
    },
    {
      "id": 81,
      "start": 266.3999938964844,
      "end": 267.760009765625,
      "text": " from our team's end."
    },
    {
      "id": 82,
      "start": 267.760009765625,
      "end": 271.0799865722656,
      "text": " So out of these three, which one is the most relevant to you?"
    },
    {
      "id": 83,
      "start": 276.5199890136719,
      "end": 279.1199951171875,
      "text": " Like these are more or less same,"
    },
    {
      "id": 84,
      "start": 279.1199951171875,
      "end": 282.8800048828125,
      "text": " but different versions of the same."
    },
    {
      "id": 85,
      "start": 282.8800048828125,
      "end": 283.8399963378906,
      "text": " I think it's the same."
    },
    {
      "id": 86,
      "start": 286.0799865722656,
      "end": 287.0799865722656,
      "text": " I think they're all same."
    },
    {
      "id": 87,
      "start": 290.55999755859375,
      "end": 291.67999267578125,
      "text": " Yeah, all three are same."
    },
    {
      "id": 88,
      "start": 295.1199951171875,
      "end": 295.6400146484375,
      "text": " I think so."
    },
    {
      "id": 89,
      "start": 295.6400146484375,
      "end": 299.5199890136719,
      "text": " Then multiple duplicate things are pasted once."
    },
    {
      "id": 90,
      "start": 300.010009765625,
      "end": 304.81000995635986,
      "text": " yeah so you want me to so you suggest me to copy paste this"
    },
    {
      "id": 91,
      "start": 304.81000995635986,
      "end": 310.25000953674316,
      "text": " no problem i i'll use what you call"
    },
    {
      "id": 92,
      "start": 311.6900100708008,
      "end": 316.65000915527344,
      "text": " i'll use this okay and are you giving me the keywords i have"
    },
    {
      "id": 93,
      "start": 316.65000915527344,
      "end": 320.1700096130371,
      "text": " three for now implementation of crm ai implementation in"
    },
    {
      "id": 94,
      "start": 320.1700096130371,
      "end": 325.93000984191895,
      "text": " crm salesman implementation yeah yeah maybe for now we can maybe"
    },
    {
      "id": 95,
      "start": 325.93000984191895,
      "end": 329.2900104522705,
      "text": " start with this one like at least i'll get few now"
    },
    {
      "id": 96,
      "start": 329.2900104522705,
      "end": 333.5300102233887,
      "text": " i'll going through i'll much more yeah"
    },
    {
      "id": 97,
      "start": 334.0900115966797,
      "end": 336.570011138916,
      "text": " okay"
    },
    {
      "id": 98,
      "start": 339.2900085449219,
      "end": 342.570011138916,
      "text": " that's it"
    },
    {
      "id": 99,
      "start": 359.2900085449219,
      "end": 372.57000732421875,
      "text": " okay"
    },
    {
      "id": 100,
      "start": 372.57000732421875,
      "end": 376.57000732421875,
      "text": " implementation of crm sales force"
    },
    {
      "id": 101,
      "start": 389.2900085449219,
      "end": 402.57000732421875,
      "text": " okay"
    },
    {
      "id": 102,
      "start": 402.57000732421875,
      "end": 416.57000732421875,
      "text": " okay"
    },
    {
      "id": 103,
      "start": 419.2900085449219,
      "end": 442.57000732421875,
      "text": " okay"
    },
    {
      "id": 104,
      "start": 442.57000732421875,
      "end": 447.1300048828125,
      "text": " so chat jeopardy is giving me a few topics i am sharing it with you"
    },
    {
      "id": 105,
      "start": 447.1300048828125,
      "end": 455.2100067138672,
      "text": " yeah so one one section is for crm and sales for implementation tools"
    },
    {
      "id": 106,
      "start": 455.2900085449219,
      "end": 468.4100036621094,
      "text": " so this one have a look"
    },
    {
      "id": 107,
      "start": 477.9300079345703,
      "end": 488.4100036621094,
      "text": " these are it related to crm okay then these are related to ai"
    },
    {
      "id": 108,
      "start": 491.69000244140625,
      "end": 502.4100036621094,
      "text": " and then cloud data engineering"
    },
    {
      "id": 109,
      "start": 502.4100036621094,
      "end": 512.2500152587891,
      "text": " 6 6 12 plus 8 18 yeah then 20 20 topics"
    },
    {
      "id": 110,
      "start": 515.8500061035156,
      "end": 521.8500061035156,
      "text": " or do you need something else or for else you can give me words so i'm i'll give you"
    },
    {
      "id": 111,
      "start": 522.2500152587891,
      "end": 525.2100067138672,
      "text": " a bit these are a lot"
    },
    {
      "id": 112,
      "start": 530.4900054931641,
      "end": 536.8900146484375,
      "text": " yeah sorry i was telling do you need a few one two liner explanation for these"
    },
    {
      "id": 113,
      "start": 536.8900146484375,
      "end": 542.4100036621094,
      "text": " topics also so that you can get the gist of what you need to write here or this is enough"
    },
    {
      "id": 114,
      "start": 543.7700042724609,
      "end": 548.1700134277344,
      "text": " yeah yeah yeah anything it could be so you use you're using chatgp only even for that or"
    },
    {
      "id": 115,
      "start": 548.1700134277344,
      "end": 557.4500122070312,
      "text": " yeah chatgp only that the basic chatgp okay okay"
    },
    {
      "id": 116,
      "start": 578.25,
      "end": 580.25,
      "text": " so"
    },
    {
      "id": 117,
      "start": 583.4500122070312,
      "end": 584.6500244140625,
      "text": " in in in all your"
    },
    {
      "id": 118,
      "start": 586.9700012207031,
      "end": 592.8099975585938,
      "text": " whomever you are a csm so what is the usual time period or time frame you know"
    },
    {
      "id": 119,
      "start": 594.0899963378906,
      "end": 599.77001953125,
      "text": " like usually people take like any any random any random period you saw any"
    },
    {
      "id": 120,
      "start": 599.9900207519531,
      "end": 602.2300207614899,
      "text": " a similar pattern you saw?"
    },
    {
      "id": 121,
      "start": 602.2300207614899,
      "end": 605.2300205230713,
      "text": " For writing all that 20 papers?"
    },
    {
      "id": 122,
      "start": 605.2300205230713,
      "end": 606.750020980835,
      "text": " Not just the papers, I'm talking"
    },
    {
      "id": 123,
      "start": 606.750020980835,
      "end": 608.9500207901001,
      "text": " about the whole journey."
    },
    {
      "id": 124,
      "start": 608.9500207901001,
      "end": 610.1500205993652,
      "text": " Yeah, maybe papers too."
    },
    {
      "id": 125,
      "start": 614.6700210571289,
      "end": 619.8700199127197,
      "text": " In my hand, I have seen people"
    },
    {
      "id": 126,
      "start": 619.8700199127197,
      "end": 622.1100215911865,
      "text": " first, because most of the people"
    },
    {
      "id": 127,
      "start": 622.1100215911865,
      "end": 625.9900207519531,
      "text": " here don't have experience of writing papers."
    },
    {
      "id": 128,
      "start": 625.9900207519531,
      "end": 628.8700199127197,
      "text": " So but when they get their hands on"
    },
    {
      "id": 129,
      "start": 628.8700199127197,
      "end": 631.6300201416016,
      "text": " and it's easy for them to move with other tasks."
    },
    {
      "id": 130,
      "start": 631.6300201416016,
      "end": 633.5500221252441,
      "text": " So parallelly, they complete multiple things."
    },
    {
      "id": 131,
      "start": 633.5500221252441,
      "end": 635.3100204467773,
      "text": " So we will also follow the same pattern,"
    },
    {
      "id": 132,
      "start": 635.3100204467773,
      "end": 637.830020904541,
      "text": " which I have been following for the other clients as well."
    },
    {
      "id": 133,
      "start": 637.830020904541,
      "end": 640.7100219726562,
      "text": " And it has helped us to go to the attorney's cage"
    },
    {
      "id": 134,
      "start": 640.7100219726562,
      "end": 642.6700210571289,
      "text": " really quick."
    },
    {
      "id": 135,
      "start": 642.6700210571289,
      "end": 645.3100204467773,
      "text": " So what we can do here is, first, we"
    },
    {
      "id": 136,
      "start": 645.3100204467773,
      "end": 647.5100212097168,
      "text": " will get our hands on this paper writing."
    },
    {
      "id": 137,
      "start": 647.5100212097168,
      "end": 650.27001953125,
      "text": " When this thing becomes easy for us,"
    },
    {
      "id": 138,
      "start": 650.27001953125,
      "end": 653.1900215148926,
      "text": " then we will move to other steps."
    },
    {
      "id": 139,
      "start": 653.1900215148926,
      "end": 655.8700218200684,
      "text": " And we can parallelly work on multiple things."
    },
    {
      "id": 140,
      "start": 659.4700202941895,
      "end": 661.7500190734863,
      "text": " So we can start working on the press,"
    },
    {
      "id": 141,
      "start": 661.7500190734863,
      "end": 663.1100196838379,
      "text": " start working on the letters."
    },
    {
      "id": 142,
      "start": 663.1100196838379,
      "end": 665.8300170898438,
      "text": " Because I'll create a separate ticket for you"
    },
    {
      "id": 143,
      "start": 665.8300170898438,
      "end": 670.4300231933594,
      "text": " for the OC letters, which will be for the papers."
    },
    {
      "id": 144,
      "start": 670.4300231933594,
      "end": 672.1500244140625,
      "text": " And for the critical role, which will"
    },
    {
      "id": 145,
      "start": 672.1500244140625,
      "end": 674.0700225830078,
      "text": " be collecting for the workplace projects"
    },
    {
      "id": 146,
      "start": 674.0700225830078,
      "end": 676.8700180053711,
      "text": " from the current company, as well as for a previous company."
    },
    {
      "id": 147,
      "start": 676.8700180053711,
      "end": 679.1100234985352,
      "text": " What we have to do there is, there will be a question."
    },
    {
      "id": 148,
      "start": 679.1100234985352,
      "end": 681.6700210571289,
      "text": " You just need to answer those questions."
    },
    {
      "id": 149,
      "start": 681.6700210571289,
      "end": 683.8700180053711,
      "text": " And our team will draft those letters for you."
    },
    {
      "id": 150,
      "start": 683.8700180053711,
      "end": 686.2300186157227,
      "text": " So you just need to give us the answer."
    },
    {
      "id": 151,
      "start": 686.2300186157227,
      "end": 688.1900177001953,
      "text": " And rest, you can take your rest of the time"
    },
    {
      "id": 152,
      "start": 688.2300186157227,
      "end": 690.27001953125,
      "text": " to focus on other tasks."
    },
    {
      "id": 153,
      "start": 690.27001953125,
      "end": 692.27001953125,
      "text": " Same goes for the press also."
    },
    {
      "id": 154,
      "start": 692.27001953125,
      "end": 693.7100219726562,
      "text": " You need to give us the answer."
    },
    {
      "id": 155,
      "start": 693.7100219726562,
      "end": 695.27001953125,
      "text": " Team will draft an article."
    },
    {
      "id": 156,
      "start": 695.27001953125,
      "end": 696.6300201416016,
      "text": " We'll review the article."
    },
    {
      "id": 157,
      "start": 696.6300201416016,
      "end": 698.9100189208984,
      "text": " If it requires any modification, the team"
    },
    {
      "id": 158,
      "start": 698.9100189208984,
      "end": 700.3500213623047,
      "text": " know why our comments."
    },
    {
      "id": 159,
      "start": 700.3500213623047,
      "end": 701.7100219726562,
      "text": " Work on it in the back end."
    },
    {
      "id": 160,
      "start": 701.7100219726562,
      "end": 705.2300186157227,
      "text": " And rest, you can focus on the other tasks."
    },
    {
      "id": 161,
      "start": 705.2300186157227,
      "end": 707.7900238037109,
      "text": " Right, right, right, got it, got it, got it, OK."
    },
    {
      "id": 162,
      "start": 707.7900238037109,
      "end": 709.4300231933594,
      "text": " It won't take, like, too much time."
    },
    {
      "id": 163,
      "start": 709.4300231933594,
      "end": 709.9300231933594,
      "text": " OK."
    },
    {
      "id": 164,
      "start": 716.1900177001953,
      "end": 718.8700180053711,
      "text": " I'm giving you the explanation also here."
    },
    {
      "id": 165,
      "start": 721.8700180053711,
      "end": 722.4700241088867,
      "text": " Where is it?"
    },
    {
      "id": 166,
      "start": 725.4300231933594,
      "end": 727.3500213623047,
      "text": " Yep."
    },
    {
      "id": 167,
      "start": 727.3500213623047,
      "end": 729.7100219726562,
      "text": " See."
    },
    {
      "id": 168,
      "start": 729.7100219726562,
      "end": 730.2100219726562,
      "text": " OK."
    },
    {
      "id": 169,
      "start": 769.4300231933594,
      "end": 774.1500244140625,
      "text": " And one of my clients shared a website with me"
    },
    {
      "id": 170,
      "start": 774.1500244140625,
      "end": 776.8700256347656,
      "text": " for writing the papers."
    },
    {
      "id": 171,
      "start": 776.8700256347656,
      "end": 778.7100219726562,
      "text": " I'm sharing it with you."
    },
    {
      "id": 172,
      "start": 778.7100219726562,
      "end": 782.2300262451172,
      "text": " You can just explore and see whether this works for you"
    },
    {
      "id": 173,
      "start": 782.2300262451172,
      "end": 783.3500213623047,
      "text": " or not, see?"
    },
    {
      "id": 174,
      "start": 783.3500213623047,
      "end": 784.7500152587891,
      "text": " Yeah, yeah, yeah, for sure."
    },
    {
      "id": 175,
      "start": 784.7500152587891,
      "end": 789.1500244140625,
      "text": " Is this also a part or just a regular?"
    },
    {
      "id": 176,
      "start": 789.1500244140625,
      "end": 790.4300231933594,
      "text": " Yeah."
    },
    {
      "id": 177,
      "start": 790.4300231933594,
      "end": 792.3100280761719,
      "text": " It's a different website which uses"
    },
    {
      "id": 178,
      "start": 792.3100280761719,
      "end": 794.0700225830078,
      "text": " AI for writing the papers."
    },
    {
      "id": 179,
      "start": 794.0700225830078,
      "end": 798.1100158691406,
      "text": " So you can try and see whether they write the paper good"
    },
    {
      "id": 180,
      "start": 798.1100158691406,
      "end": 800.3900146484375,
      "text": " or not."
    },
    {
      "id": 181,
      "start": 800.3900146484375,
      "end": 804.2300262451172,
      "text": " And, Aditya, once I'm done with one, for example,"
    },
    {
      "id": 182,
      "start": 804.2300262451172,
      "end": 807.7500152587891,
      "text": " like I'm done, I'm for sure I'll try to sit these four days"
    },
    {
      "id": 183,
      "start": 807.7500152587891,
      "end": 810.3900146484375,
      "text": " and I'll try to publish something by this weekend."
    },
    {
      "id": 184,
      "start": 810.3900146484375,
      "end": 812.9900207519531,
      "text": " So can I directly copy-paste in this WhatsApp group"
    },
    {
      "id": 185,
      "start": 812.9900207519531,
      "end": 816.5900268554688,
      "text": " the paper, whichever I write, for your review?"
    },
    {
      "id": 186,
      "start": 816.5900268554688,
      "end": 818.7900238037109,
      "text": " Instead, the best way here will be"
    },
    {
      "id": 187,
      "start": 818.7900238037109,
      "end": 820.8700256347656,
      "text": " you use Google Docs to write your paper."
    },
    {
      "id": 188,
      "start": 820.8700256347656,
      "end": 822.7500152587891,
      "text": " There you paste all the content."
    },
    {
      "id": 189,
      "start": 822.7500152587891,
      "end": 825.6700134277344,
      "text": " And then share that Google Doc with me."
    },
    {
      "id": 190,
      "start": 825.7500152587891,
      "end": 828.2300262451172,
      "text": " Provide me the link of that Google Doc."
    },
    {
      "id": 191,
      "start": 828.2300262451172,
      "end": 831.3900146484375,
      "text": " And it will be easy for me to highlight the section where"
    },
    {
      "id": 192,
      "start": 831.3900146484375,
      "end": 834.5500183105469,
      "text": " it requires changes, or I can leave comments easily there."
    },
    {
      "id": 193,
      "start": 834.5500183105469,
      "end": 838.0300140380859,
      "text": " And you can review those comments, make edited changes,"
    },
    {
      "id": 194,
      "start": 838.0300140380859,
      "end": 840.7500152587891,
      "text": " and then I will again check back."
    },
    {
      "id": 195,
      "start": 840.7500152587891,
      "end": 844.1100158691406,
      "text": " So it will be easy for us."
    },
    {
      "id": 196,
      "start": 844.1100158691406,
      "end": 846.5100250244141,
      "text": " It will save us time for too much back and forth."
    },
    {
      "id": 197,
      "start": 846.5100250244141,
      "end": 849.6700134277344,
      "text": " But if you share the Doc with me on WhatsApp,"
    },
    {
      "id": 198,
      "start": 849.6700134277344,
      "end": 851.5500183105469,
      "text": " like the Doc version, then I have"
    },
    {
      "id": 199,
      "start": 851.5500183105469,
      "end": 852.9900207519531,
      "text": " to open the Doc, download the Doc,"
    },
    {
      "id": 200,
      "start": 852.9900207519531,
      "end": 857.4300231933594,
      "text": " and then I will have to type SMS to you explaining all this."
    },
    {
      "id": 201,
      "start": 857.4300231933594,
      "end": 859.8700256347656,
      "text": " Sure, sure, sure, sure."
    },
    {
      "id": 202,
      "start": 859.8700256347656,
      "end": 861.6700134277344,
      "text": " Got it, got it, got it."
    },
    {
      "id": 203,
      "start": 861.6700134277344,
      "end": 863.6300354003906,
      "text": " So work on the Google Doc thing."
    },
    {
      "id": 204,
      "start": 863.6300354003906,
      "end": 866.1900329589844,
      "text": " You can create a ticket, or you can directly provide me"
    },
    {
      "id": 205,
      "start": 866.1900329589844,
      "end": 868.4700317382812,
      "text": " with the link of that."
    },
    {
      "id": 206,
      "start": 868.4700317382812,
      "end": 870.6700134277344,
      "text": " And I can leave my comments there."
    },
    {
      "id": 207,
      "start": 870.6700134277344,
      "end": 874.1500244140625,
      "text": " And it will be easy for us."
    },
    {
      "id": 208,
      "start": 874.1500244140625,
      "end": 876.3900146484375,
      "text": " OK, OK, got it, got it."
    },
    {
      "id": 209,
      "start": 876.3900146484375,
      "end": 877.4300231933594,
      "text": " Yeah, sure, Aritja."
    },
    {
      "id": 210,
      "start": 877.4300231933594,
      "end": 882.3900146484375,
      "text": " With this, I'll at least try to target one by this weekend."
    },
    {
      "id": 211,
      "start": 883.5500183105469,
      "end": 884.6700134277344,
      "text": " I know you can do it."
    },
    {
      "id": 212,
      "start": 884.6700134277344,
      "end": 888.1900329589844,
      "text": " Like, I 100% know, and I can take the guarantee"
    },
    {
      "id": 213,
      "start": 888.1900329589844,
      "end": 890.3900146484375,
      "text": " that you can definitely do this."
    },
    {
      "id": 214,
      "start": 890.3900146484375,
      "end": 895.6300354003906,
      "text": " This is not something like a neuroscience engineering thing,"
    },
    {
      "id": 215,
      "start": 895.6300354003906,
      "end": 897.0700073242188,
      "text": " which is very much complicated."
    },
    {
      "id": 216,
      "start": 897.0700073242188,
      "end": 898.3900146484375,
      "text": " I didn't know all these tools."
    },
    {
      "id": 217,
      "start": 898.3900146484375,
      "end": 901.2300109863281,
      "text": " I was simply taking some feedback."
    },
    {
      "id": 218,
      "start": 900.0000305175781,
      "end": 903.7600305080414,
      "text": " back in the Google, and I was writing on my own."
    },
    {
      "id": 219,
      "start": 903.7600305080414,
      "end": 905.2000303268433,
      "text": " Yeah, yeah, yeah."
    },
    {
      "id": 220,
      "start": 905.2000303268433,
      "end": 906.880030632019,
      "text": " That is a long process."
    },
    {
      "id": 221,
      "start": 906.880030632019,
      "end": 907.6800303459167,
      "text": " That is too much."
    },
    {
      "id": 222,
      "start": 907.6800303459167,
      "end": 908.1800308227539,
      "text": " Yeah."
    },
    {
      "id": 223,
      "start": 908.1800308227539,
      "end": 911.5200309753418,
      "text": " That's why I was like, I was after seeing all the reviews,"
    },
    {
      "id": 224,
      "start": 911.5200309753418,
      "end": 915.0400304794312,
      "text": " I had to pick every, when I went through some sample of this,"
    },
    {
      "id": 225,
      "start": 915.0400304794312,
      "end": 917.4800300598145,
      "text": " there was also some links where they got it."
    },
    {
      "id": 226,
      "start": 917.4800300598145,
      "end": 919.4400310516357,
      "text": " So I was like shocked, like whether I"
    },
    {
      "id": 227,
      "start": 919.4400310516357,
      "end": 920.4800300598145,
      "text": " can put these or not."
    },
    {
      "id": 228,
      "start": 920.4800300598145,
      "end": 923.0000305175781,
      "text": " So I was a little stuck there, and I"
    },
    {
      "id": 229,
      "start": 923.0000305175781,
      "end": 924.2400302886963,
      "text": " couldn't do any progress."
    },
    {
      "id": 230,
      "start": 924.2400302886963,
      "end": 929.7200298309326,
      "text": " But yeah, I'll try to at least target one at least"
    },
    {
      "id": 231,
      "start": 929.7200298309326,
      "end": 932.0000305175781,
      "text": " by this weekend for your review."
    },
    {
      "id": 232,
      "start": 932.0000305175781,
      "end": 933.5200309753418,
      "text": " Yeah, we will take small step."
    },
    {
      "id": 233,
      "start": 933.5200309753418,
      "end": 936.6000289916992,
      "text": " There is nothing to hurry."
    },
    {
      "id": 234,
      "start": 936.6000289916992,
      "end": 939.9200286865234,
      "text": " Just follow the structure which I have shared with you."
    },
    {
      "id": 235,
      "start": 939.9200286865234,
      "end": 944.0000305175781,
      "text": " This is the structure which things we need in the paper."
    },
    {
      "id": 236,
      "start": 944.0000305175781,
      "end": 945.7600288391113,
      "text": " Whenever you are struck somewhere,"
    },
    {
      "id": 237,
      "start": 945.7600288391113,
      "end": 949.4400291442871,
      "text": " whenever you are like that I'm in a rabbit hole,"
    },
    {
      "id": 238,
      "start": 949.4400291442871,
      "end": 953.0800323486328,
      "text": " I can't move anywhere now, just ping me, give me a call."
    },
    {
      "id": 239,
      "start": 953.0800323486328,
      "end": 954.3600311279297,
      "text": " I'll be there to help you out."
    },
    {
      "id": 240,
      "start": 954.3600311279297,
      "end": 956.1600303649902,
      "text": " Yeah, yeah, yeah, sure."
    },
    {
      "id": 241,
      "start": 956.1600303649902,
      "end": 958.6400299072266,
      "text": " And then this payment also I'll complete."
    },
    {
      "id": 242,
      "start": 958.6400299072266,
      "end": 960.5200309753418,
      "text": " I'll complete the recharges."
    },
    {
      "id": 243,
      "start": 960.5200309753418,
      "end": 961.9600296020508,
      "text": " I didn't open this well."
    },
    {
      "id": 244,
      "start": 961.9600296020508,
      "end": 964.1600341796875,
      "text": " But yeah, I'll complete this too."
    },
    {
      "id": 245,
      "start": 964.1600341796875,
      "end": 965.6800308227539,
      "text": " Yeah, yeah, sure."
    },
    {
      "id": 246,
      "start": 965.6800308227539,
      "end": 967.3600311279297,
      "text": " Yeah, for sure, for sure."
    },
    {
      "id": 247,
      "start": 967.3600311279297,
      "end": 971.9200286865234,
      "text": " I think I paid 90% just this is remaining, but I'll pay it off."
    },
    {
      "id": 248,
      "start": 971.9200286865234,
      "end": 973.5200271606445,
      "text": " Yeah, the second installment is only."
    },
    {
      "id": 249,
      "start": 973.5200271606445,
      "end": 975.2000274658203,
      "text": " Yeah, yeah, this is the last one."
    },
    {
      "id": 250,
      "start": 975.2000274658203,
      "end": 978.1600341796875,
      "text": " I paid 85% almost."
    },
    {
      "id": 251,
      "start": 978.1600341796875,
      "end": 980.0400314331055,
      "text": " Yeah, yeah, you are almost on time."
    },
    {
      "id": 252,
      "start": 980.0400314331055,
      "end": 983.1600341796875,
      "text": " I paid almost 90% just this one."
    },
    {
      "id": 253,
      "start": 983.1600341796875,
      "end": 985.1200332641602,
      "text": " I'll pay, I'll complete this too."
    },
    {
      "id": 254,
      "start": 985.1200332641602,
      "end": 986.8800277709961,
      "text": " Yeah, yeah, sure, sure, sure."
    },
    {
      "id": 255,
      "start": 986.8800277709961,
      "end": 992.0400314331055,
      "text": " And this was one of the tool like people use more tools."
    },
    {
      "id": 256,
      "start": 992.0400314331055,
      "end": 995.0400314331055,
      "text": " Basically, mostly they focus on the chat GPT and other things"
    },
    {
      "id": 257,
      "start": 995.0400314331055,
      "end": 996.4400329589844,
      "text": " to write the papers."
    },
    {
      "id": 258,
      "start": 996.4400329589844,
      "end": 998.3200302124023,
      "text": " And if they are generated by them,"
    },
    {
      "id": 259,
      "start": 998.3200302124023,
      "end": 1000.4800338745117,
      "text": " they add their own touch to it live."
    },
    {
      "id": 260,
      "start": 1000.4800338745117,
      "end": 1003.5600280761719,
      "text": " Because mostly what AI tools does"
    },
    {
      "id": 261,
      "start": 1003.5600280761719,
      "end": 1008.0000305175781,
      "text": " is like they give the references of online articles."
    },
    {
      "id": 262,
      "start": 1008.0000305175781,
      "end": 1011.7200317382812,
      "text": " But what you can do is you can scrape the website online"
    },
    {
      "id": 263,
      "start": 1011.7200317382812,
      "end": 1014.4400329589844,
      "text": " and find a few papers which are related to your field."
    },
    {
      "id": 264,
      "start": 1014.4400329589844,
      "end": 1019.5600280761719,
      "text": " And cite those papers topics within your paper."
    },
    {
      "id": 265,
      "start": 1019.5600280761719,
      "end": 1020.4400329589844,
      "text": " OK, OK."
    },
    {
      "id": 266,
      "start": 1020.4400329589844,
      "end": 1021.9600296020508,
      "text": " And give proper citations."
    },
    {
      "id": 267,
      "start": 1021.9600296020508,
      "end": 1024.5200271606445,
      "text": " In this way, you will increase the references also."
    },
    {
      "id": 268,
      "start": 1024.5200271606445,
      "end": 1027.2000274658203,
      "text": " And the citation within the content"
    },
    {
      "id": 269,
      "start": 1027.2000274658203,
      "end": 1029.3200378417969,
      "text": " will make it more legitimate also."
    },
    {
      "id": 270,
      "start": 1029.3200378417969,
      "end": 1032.040023803711,
      "text": " And it will give you more personal touch"
    },
    {
      "id": 271,
      "start": 1032.040023803711,
      "end": 1035.800033569336,
      "text": " and it will humanize your content more."
    },
    {
      "id": 272,
      "start": 1035.800033569336,
      "end": 1037.2000274658203,
      "text": " OK, got it, got it."
    },
    {
      "id": 273,
      "start": 1037.2000274658203,
      "end": 1038.6800231933594,
      "text": " Yeah, yeah."
    },
    {
      "id": 274,
      "start": 1038.6800231933594,
      "end": 1041.1200256347656,
      "text": " Sure, I'll do it."
    },
    {
      "id": 275,
      "start": 1041.1200256347656,
      "end": 1042.040023803711,
      "text": " Yeah, thank you."
    },
    {
      "id": 276,
      "start": 1042.040023803711,
      "end": 1043.6800231933594,
      "text": " Thank you for providing this, Blainley."
    },
    {
      "id": 277,
      "start": 1043.6800231933594,
      "end": 1045.6800231933594,
      "text": " I think this is really good too."
    },
    {
      "id": 278,
      "start": 1045.6800231933594,
      "end": 1046.4400329589844,
      "text": " Yeah, yeah."
    },
    {
      "id": 279,
      "start": 1046.4400329589844,
      "end": 1047.8800354003906,
      "text": " I'll try."
    },
    {
      "id": 280,
      "start": 1047.8800354003906,
      "end": 1051.6800231933594,
      "text": " And if I find any other tools from here,"
    },
    {
      "id": 281,
      "start": 1051.6800231933594,
      "end": 1054.7200317382812,
      "text": " if I have something anywhere in my inbox,"
    },
    {
      "id": 282,
      "start": 1054.7200317382812,
      "end": 1056.280029296875,
      "text": " I'll definitely send it to you."
    },
    {
      "id": 283,
      "start": 1056.280029296875,
      "end": 1057.2400360107422,
      "text": " It will help you a lot."
    },
    {
      "id": 284,
      "start": 1060.2000274658203,
      "end": 1060.9600372314453,
      "text": " OK, OK."
    },
    {
      "id": 285,
      "start": 1060.9600372314453,
      "end": 1061.760025024414,
      "text": " Sure, Aditya."
    },
    {
      "id": 286,
      "start": 1061.760025024414,
      "end": 1063.4400329589844,
      "text": " Thank you, thank you very much."
    },
    {
      "id": 287,
      "start": 1063.4400329589844,
      "end": 1065.5600280761719,
      "text": " Anything else you need from my end?"
    },
    {
      "id": 288,
      "start": 1065.5600280761719,
      "end": 1066.4000244140625,
      "text": " No, no, Aditya."
    },
    {
      "id": 289,
      "start": 1066.4000244140625,
      "end": 1067.4800262451172,
      "text": " This is a big help."
    },
    {
      "id": 290,
      "start": 1067.4800262451172,
      "end": 1071.2000274658203,
      "text": " And I can at least start something confident now."
    },
    {
      "id": 291,
      "start": 1071.2000274658203,
      "end": 1071.8400268554688,
      "text": " Yeah, yeah."
    },
    {
      "id": 292,
      "start": 1071.8400268554688,
      "end": 1075.040023803711,
      "text": " And also, are you working on the rest of the tickets,"
    },
    {
      "id": 293,
      "start": 1075.040023803711,
      "end": 1078.760025024414,
      "text": " like the opportunities one?"
    },
    {
      "id": 294,
      "start": 1078.760025024414,
      "end": 1081.2400360107422,
      "text": " Oh, the team has not assigned you the opportunities?"
    },
    {
      "id": 295,
      "start": 1081.2400360107422,
      "end": 1082.2000274658203,
      "text": " No, no, Aditya."
    },
    {
      "id": 296,
      "start": 1082.2000274658203,
      "end": 1085.1200256347656,
      "text": " In the very initially, I was assigned all the tickets."
    },
    {
      "id": 297,
      "start": 1085.1200256347656,
      "end": 1088.2400360107422,
      "text": " I given all the responses I could."
    },
    {
      "id": 298,
      "start": 1088.2400360107422,
      "end": 1088.9200286865234,
      "text": " And that's it."
    },
    {
      "id": 299,
      "start": 1088.9200286865234,
      "end": 1089.6800231933594,
      "text": " That's the done."
    },
    {
      "id": 300,
      "start": 1089.6800231933594,
      "end": 1093.0800323486328,
      "text": " Nothing, no to and fro, nothing till today."
    },
    {
      "id": 301,
      "start": 1093.0800323486328,
      "end": 1094.3600311279297,
      "text": " Nothing, no, no."
    },
    {
      "id": 302,
      "start": 1094.3600311279297,
      "end": 1098.9200286865234,
      "text": " Just that compensation one is what they have figured out"
    },
    {
      "id": 303,
      "start": 1098.9200286865234,
      "end": 1100.2400360107422,
      "text": " that I'm unfit for that."
    },
    {
      "id": 304,
      "start": 1100.280029296875,
      "end": 1103.1600341796875,
      "text": " But other than that, I don't have any update on anything."
    },
    {
      "id": 305,
      "start": 1107.520034790039,
      "end": 1108.4800262451172,
      "text": " I think so."
    },
    {
      "id": 306,
      "start": 1108.4800262451172,
      "end": 1110.1200256347656,
      "text": " Like, we should not worry too much,"
    },
    {
      "id": 307,
      "start": 1110.1200256347656,
      "end": 1114.800033569336,
      "text": " because I'll take care of the rest of the thing."
    },
    {
      "id": 308,
      "start": 1114.800033569336,
      "end": 1118.4000244140625,
      "text": " Just like, let's complete the first draft."
    },
    {
      "id": 309,
      "start": 1118.4000244140625,
      "end": 1120.4800262451172,
      "text": " And then we will move on to the next step"
    },
    {
      "id": 310,
      "start": 1120.4800262451172,
      "end": 1123.040023803711,
      "text": " when you get more confident on the process."
    },
    {
      "id": 311,
      "start": 1123.040023803711,
      "end": 1124.9600372314453,
      "text": " And things will become easier for you."
    },
    {
      "id": 312,
      "start": 1124.9600372314453,
      "end": 1127.9200286865234,
      "text": " We will start working on multiple things."
    },
    {
      "id": 313,
      "start": 1127.9200286865234,
      "end": 1128.760025024414,
      "text": " Yeah, yeah, yeah."
    },
    {
      "id": 314,
      "start": 1128.760025024414,
      "end": 1129.4800262451172,
      "text": " Sure, Aditya."
    },
    {
      "id": 315,
      "start": 1129.4800262451172,
      "end": 1130.0800323486328,
      "text": " Yeah, yeah."
    },
    {
      "id": 316,
      "start": 1130.800033569336,
      "end": 1132.800033569336,
      "text": " And no worries."
    },
    {
      "id": 317,
      "start": 1132.800033569336,
      "end": 1135.7200317382812,
      "text": " Don't be nervous or anything."
    },
    {
      "id": 318,
      "start": 1135.7200317382812,
      "end": 1137.9200286865234,
      "text": " Yeah, yeah."
    },
    {
      "id": 319,
      "start": 1137.9200286865234,
      "end": 1138.9600372314453,
      "text": " Yeah, sure, sure."
    },
    {
      "id": 320,
      "start": 1138.9600372314453,
      "end": 1139.760025024414,
      "text": " Thank you very much."
    },
    {
      "id": 321,
      "start": 1139.760025024414,
      "end": 1140.800033569336,
      "text": " Thank you."
    },
    {
      "id": 322,
      "start": 1140.800033569336,
      "end": 1142.4400329589844,
      "text": " OK, but thank you for your time, Gita."
    },
    {
      "id": 323,
      "start": 1142.4400329589844,
      "end": 1143.1200256347656,
      "text": " Have a nice day."
    },
    {
      "id": 324,
      "start": 1143.1200256347656,
      "end": 1144.6000366210938,
      "text": " Bye, Aditya."
    },
    {
      "id": 325,
      "start": 1144.6000366210938,
      "end": 1146.280029296875,
      "text": " I will bring you back, yeah."
    },
    {
      "id": 326,
      "start": 1146.280029296875,
      "end": 1147.280029296875,
      "text": " Yeah, yeah, sure, sure."
    },
    {
      "id": 327,
      "start": 1147.280029296875,
      "end": 1147.800033569336,
      "text": " Bye, bye."
    },
    {
      "id": 328,
      "start": 1147.800033569336,
      "end": 1148.280029296875,
      "text": " Thank you."
    },
    {
      "id": 329,
      "start": 1148.280029296875,
      "end": 1149.040023803711,
      "text": " Have a good night."
    },
    {
      "id": 330,
      "start": 1149.040023803711,
      "end": 1150.6000366210938,
      "text": " Bye."
    },
    {
      "id": 331,
      "start": 1160.0800170898438,
      "end": 1161.6400451660156,
      "text": " Bye."
    }
  ]
};

(async () => {
  try {
    const result = await scoreTranscript(transcript.text);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
  }
})();