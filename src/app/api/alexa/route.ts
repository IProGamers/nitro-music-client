import { NextResponse } from 'next/server';

const NITRO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const requestType = body.request?.type;
        const intentName = body.request?.intent?.name;

        console.log('Alexa Request:', { type: requestType, intent: intentName });

        let response;

        switch (requestType) {
            case 'LaunchRequest':
                response = buildSpeechResponse('Welcome to Nitro Music! What would you like to play?', false);
                break;

            case 'IntentRequest':
                response = await handleIntent(intentName, body.request.intent.slots);
                break;

            case 'AudioPlayer.PlaybackFinished':
            case 'AudioPlayer.PlaybackStarted':
            case 'AudioPlayer.PlaybackStopped':
            case 'AudioPlayer.PlaybackNearlyFinished':
            case 'AudioPlayer.PlaybackFailed':
                // Alexa requires acknowledging these events
                response = { version: '1.0', response: {} };
                break;

            case 'SessionEndedRequest':
                response = { version: '1.0', response: {} };
                break;

            default:
                response = buildSpeechResponse('Nitro is ready. You can ask me to play a song.', false);
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Alexa Error:', error);
        return NextResponse.json(buildSpeechResponse('Sorry, there was an issue connecting to Nitro Music.', true));
    }
}

async function handleIntent(intentName: string, slots: any) {
    switch (intentName) {
        case 'PlaySongIntent':
            const songName = slots?.songName?.value;
            if (!songName) {
                return buildSpeechResponse('What song would you like to play?', false);
            }

            try {
                const query = encodeURIComponent(songName);
                const searchRes = await fetch(`${NITRO_API_URL}/api/search/songs?query=${query}&limit=1`);
                const searchData = await searchRes.json();

                if (searchData.success && searchData.data?.length > 0) {
                    const song = searchData.data[0];
                    const audioUrl = getAudioUrl(song);

                    if (!audioUrl) {
                        return buildSpeechResponse(`I found ${song.name}, but the audio stream is currently unavailable.`, true);
                    }

                    const artist = typeof song.primaryArtists === 'string' ? song.primaryArtists : (song.primaryArtists?.[0]?.name || 'Unknown Artist');
                    const imageUrl = song.image?.[song.image.length - 1]?.link || song.image?.[song.image.length - 1]?.url || '';

                    return buildAudioResponse(song.name, artist, audioUrl, imageUrl);
                }
                return buildSpeechResponse(`I couldn't find any song called ${songName} on Nitro.`, true);
            } catch (e) {
                console.error('Search error:', e);
                return buildSpeechResponse('I had some trouble searching for that song. Please try again.', true);
            }

        case 'AMAZON.PauseIntent':
        case 'AMAZON.StopIntent':
        case 'AMAZON.CancelIntent':
            return {
                version: '1.0',
                response: {
                    directives: [{ type: 'AudioPlayer.Stop' }],
                    shouldEndSession: true
                }
            };

        case 'AMAZON.ResumeIntent':
            return buildSpeechResponse('Resuming Nitro Music.', false);

        case 'AMAZON.HelpIntent':
            return buildSpeechResponse('You can say, play Shape of You, or ask Nitro to play music.', false);

        default:
            return buildSpeechResponse('I didn\'t recognize that command for Nitro Music.', false);
    }
}

function getAudioUrl(song: any) {
    if (song.downloadUrl && song.downloadUrl.length) {
        // Alexa works best with high quality MP3/AAC
        // downloadUrl array typically: [0: 12kbps, 1: 48kbps, 2: 96kbps, 3: 160kbps, 4: 320kbps]
        const bestQuality = song.downloadUrl[song.downloadUrl.length - 1];
        return bestQuality.url || bestQuality.link;
    }
    return song.audioUrl || null;
}

function buildSpeechResponse(text: string, shouldEnd: boolean) {
    return {
        version: '1.0',
        response: {
            outputSpeech: { type: 'PlainText', text },
            shouldEndSession: shouldEnd
        }
    };
}

function buildAudioResponse(title: string, artist: string, audioUrl: string, imageUrl: string) {
    return {
        version: '1.0',
        response: {
            outputSpeech: { type: 'PlainText', text: `Playing ${title} by ${artist} on Nitro` },
            directives: [{
                type: 'AudioPlayer.Play',
                playBehavior: 'REPLACE_ALL',
                audioItem: {
                    stream: {
                        url: audioUrl,
                        token: audioUrl,
                        offsetInMilliseconds: 0
                    },
                    metadata: {
                        title: title,
                        subtitle: artist,
                        art: imageUrl ? {
                            sources: [{ url: imageUrl }]
                        } : undefined
                    }
                }
            }],
            shouldEndSession: true
        }
    };
}
