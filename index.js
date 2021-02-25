// All global variables
let STORE = [];
let questionNumber = 1;
let correctAnswers = 0;
let incorrectAnswers = 0;
let currentQuestion = 0;
let correctMessage;
let incorrectMessage;

// Runs at start
window.onload = function(){ buttons() };

// All of the button press options
function buttons() {
	$('.box').on('click', '#begin', function() {

		// stops button from reloading page
		event.preventDefault();

		// grabs the number of questions from the input
		let numQ = $('#numQ').val();

		let diff;
		let cat;

		// if difficulty isn't specified, we don't want a string messing up url
		if ($('#difficulty').val() === 'any') {
			diff = '';
		} else {
			diff = `&difficulty=${$('#difficulty').val()}`;
		}

		// if category isn't specified, we don't want a string messing up url
		if ($('#category').val() === 'any') {
			cat = '';
		} else {
			cat = `&category=${$('#category').val()}`;
		}

		// Lets user know the quiz is loading and prevents them from clicking twice
		$('#begin').replaceWith(`<p>Loading...</p>`);
	
		createQuestions(numQ, diff, cat);
	});

	$('.box').on('click', '#next', function() {
		event.preventDefault();
		handleNext();
	});

	$('.box').on('click', '#guess', function() {
		event.preventDefault();
		handleGuess();
	});

	$('.box').on('click', '#restart', function() {
		event.preventDefault();

		// wipe the questions before game starts again
		STORE = [];

		restartQuiz();
	});
}

// Uses fetch to utilize the API and sends the JSON data to the testData function
function createQuestions(numQ, diff, cat) {

	let url = `https://opentdb.com/api.php?amount=${numQ}&type=multiple${diff}${cat}`;

	fetch(url)
		.then((response) => response.json())
		.then((responseJson) => testData(responseJson, numQ, diff, cat))
		.catch((error) => alert(error));
}

// This makes sure the API has enough questions for requested specifications
function testData(data, numQ, diff, cat) {
	if(data.response_code === 0){
		createArr(data);
	}
	else {
		numQ--;
		createQuestions(numQ, diff, cat);
	}
}

// creates the array of questions using the JSON data
function createArr(data) {
	for (let question in data.results) {

		// creates an array of the potential answers
		let arr = [];
		arr.push(data.results[question].correct_answer);
		arr.push(data.results[question].incorrect_answers[0]);
		arr.push(data.results[question].incorrect_answers[1]);
		arr.push(data.results[question].incorrect_answers[2]);

		// jumbles up the order of the answers
		for (let i = arr.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			[ arr[i], arr[j] ] = [ arr[j], arr[i] ];
		}

		// makes an object containing the question, array of potential answers, and actual answer
		let newObj = {
			question    : data.results[question].question,
			answers     : arr,
			rightAnswer : data.results[question].correct_answer
		};
		STORE.push(newObj);
	}
	renderQuestion();
}

// Renders the question form
function renderQuestion() {
	$('.box').html(
		`
        <form>
        <fieldset name="question">
            <legend>Question ${questionNumber} of ${STORE.length}</legend>
            ${STORE[currentQuestion].question}
        </fieldset>
        <fieldset name="answers">
            <legend>Answers</legend>
            <input type="radio" name="answer" class="posAnswer" value="${STORE[currentQuestion]
				.answers[0]}" data-value= "${STORE[currentQuestion].answers[0]}"> ${STORE[currentQuestion]
		.answers[0]}<br>
            <input type="radio" name="answer" class="posAnswer" value="${STORE[currentQuestion]
				.answers[1]}" data-value= "${STORE[currentQuestion].answers[1]}"> ${STORE[currentQuestion]
		.answers[1]}<br>
            <input type="radio" name="answer" class="posAnswer" value="${STORE[currentQuestion]
				.answers[2]}" data-value= "${STORE[currentQuestion].answers[2]}"> ${STORE[currentQuestion]
		.answers[2]}<br>
            <input type="radio" name="answer" class="posAnswer" value="${STORE[currentQuestion]
				.answers[3]}" data-value= "${STORE[currentQuestion].answers[3]}"> ${STORE[currentQuestion]
		.answers[3]}<br>
            <button name="answer" id="guess">Submit</button>
            <button name="answer" id="next" class="hidden">Next</button>
        </fieldset>
        </form>
        <p class="hidden" id="message">Test</p>
        <p class="hidden wrong" id="error">"Please select an answer."</p>
    `
	);
}

// Handles when someone guesses an answer
function handleGuess() {

	// Checks to see if an option is checked
	if ($("input[name='answer']:checked").data('value')) {
		guess();
	} else {

		// Shows the error message if nothing is checked
		if ($('#error').hasClass('hidden')) {
			$('#error').toggleClass('hidden');
		}
	}
}

// Checks whether answer is correct or not
function guess() {
	if (!$('#error').hasClass('hidden')) {
		$('#error').toggleClass('hidden');
	}

	// disables ability to guess again on current question
	$('input[type=radio]').attr('disabled', true);

	// had to add this because there were issues with questions having apostrophes etc for comparing answers
	let encodedStr = STORE[currentQuestion].rightAnswer;
	let parser = new DOMParser();
	let dom = parser.parseFromString('<!doctype html><body>' + encodedStr, 'text/html');
	let decodedString = dom.body.textContent; 

	correctMessage = `That is correct! Way to go!`;
	incorrectMessage = `That is incorrect. The correct answer is: ${decodedString}.`; 

	if ($("input[name='answer']:checked").data('value') == decodedString) {
		$('#message').text(`${correctMessage}`);
		correctAnswers++;
	} else {
		$('#message').text(`${incorrectMessage}`);
		incorrectAnswers++;
	}
	toggleClasses();
}

// Toggles the messages for correct/incorrect and shows the new score
function toggleClasses() {
	$('#message').toggleClass('hidden');
	$('#guess').toggleClass('hidden');
	$('#next').toggleClass('hidden');
	$('.scoreboard').html(scores());
}


// Handles when someone presses the next button
function handleNext() {
	if (questionNumber != STORE.length) {
		currentQuestion++;
		questionNumber++;
		renderQuestion();
	} else {
		$('.box').html(results());
	}
}

// This is the display for the results page.
function results() {

	// messages given based on score
	let goodScore = 'You really know your trivia!';
	let okayScore = 'Try again and see if you can do better!';
	let badScore = 'This quiz was not meant for you.';

	// messages if there are any errors in rendering the site
	let scoreMessage = "If you're seeing this, there's an error.";
	let resultImage = "If you're seeing this, there's an error.";
	let resultImageAlt = 'Picture based on score';

	if (correctAnswers > STORE.length * 0.7) {
		scoreMessage = goodScore;
		resultImage = 'images/party.png';
		resultImageAlt = 'Celebrate';
	} else if (correctAnswers > STORE.length * 0.4) {
		scoreMessage = okayScore;
		resultImage = 'images/thumbs-up.png';
		resultImageAlt = 'Thumbs Up';
	} else {
		scoreMessage = badScore;
		resultImage = 'images/thumbs-down.png';
		resultImageAlt = 'Thumbs Down';
	}

	const resultBox = `
    <div class='results'>
        <h2>Results</h2>
        <p>
            You got ${correctAnswers} out of ${STORE.length} questions correct. ${scoreMessage}
        </p>
        <img src=${resultImage} alt=${resultImageAlt}> 
        <button name="answer" id="restart" class="resultBtn">New Quiz</button>
    </div>
    `;
	return resultBox;
}

// Resets everything and starts fresh
function restartQuiz() {
	questionNumber = 1;
	correctAnswers = 0;
	incorrectAnswers = 0;
	currentQuestion = 0;
	$('.box').html(`
        <form>
            <fieldset name="intro">
                <legend>Try It Out</legend>
                Test your knowledge with a random quiz!
            </fieldset>
            <fieldset name="options">
            <label for="numQ">Number of Questions</label>
            <input type="number" placeholder="10" id="numQ" s min="1" max="50" value="10" />
            <br>
            <label for="difficulty">Choose a difficulty</label>
            <select name="difficulty" id="difficulty">
                <option value="any">Mixed Difficulty</option>
                <option value="easy">Easy Questions</option>
                <option value="medium">Medium Questions</option>
                <option value="hard">Hard Questions</option>
            </select>
            <br>
            <label for="category">Select a Category: </label>
            <select name="category" id="category">
				<option value="any">Any Category</option>
				<option value="27">Animals</option>
				<option value="25">Art</option>
				<option value="16">Board Games</option>
				<option value="10">Books</option>
				<option value="32">Cartoon &amp; Animations</option>
				<option value="26">Celebrities</option>
				<option value="29">Comics</option>
				<option value="11">Film</option>
				<option value="9">General Knowledge</option>
				<option value="22">Geography</option>
				<option value="23">History</option>
				<option value="31">Japanese Anime &amp; Manga</option>
				<option value="12">Music</option>
				<option value="13">Musicals &amp; Theatres</option>
				<option value="20">Mythology</option>
				<option value="24">Politics</option>
				<option value="17">Science &amp; Nature</option>
				<option value="18">Science: Computers</option>
				<option value="30">Science: Gadgets</option>
				<option value="19">Science: Mathematics</option>
				<option value="21">Sports</option>
				<option value="14">Television</option>
				<option value="28">Vehicles</option>
				<option value="15">Video Games</option>    
            </select>
            </fieldset>
            <button id="begin">Begin</button>
        </form>
    `);
	$('.scoreboard').html(scores());
}

// Handles the display of the scores
function scores() {
	const scoreMake = `
        <li class="scores">Correct: ${correctAnswers}</li>
        <li class="scores">Incorrect: ${incorrectAnswers}</li>
    `;
	return scoreMake;
}



