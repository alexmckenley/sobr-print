import React from "react";
import logo from "./logo512.png";
import { useLocalStorage } from "@rehooks/local-storage";
import "./App.css";
import autosize from "autosize";
import moment from "moment";

type PrintJob = {
  id: string;
  text: string;
  date: number;
};

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    // eslint-disable-next-line
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function print(text: string): Promise<PrintJob> {
  const job = {
    id: uuidv4(),
    text,
    date: Date.now(),
  };

  const preparedText = "\n\n\n" + text;
  return fetch("http://sobr.co:8888/", {
    method: "POST",
    body: preparedText,
  }).then((response) => {
    if (response.status === 200) {
      return job;
    } else {
      return Promise.reject();
    }
  });
}

function App() {
  const [printHistory, setPrintHistory] = useLocalStorage<PrintJob[]>(
    "PSCHistory",
    []
  );
  const [isPrinterOnline, setIsPrinterOnline] = React.useState(false);
  const textareaNodeRef = React.useRef<HTMLTextAreaElement>(null);

  const pollStatus = React.useCallback(() => {
    fetch("http://sobr.co:8888/", { method: "GET" })
      .then((response) => {
        if (response.status === 200) {
          setIsPrinterOnline(true);
        } else {
          setIsPrinterOnline(false);
        }
      })
      .catch(() => setIsPrinterOnline(false));
  }, []);

  React.useEffect(() => {
    pollStatus();
    const intervalID = setInterval(() => {
      pollStatus();
    }, 5000);
    return () => {
      clearInterval(intervalID);
    };
  }, [pollStatus]);

  React.useEffect(() => {
    const node = textareaNodeRef.current;
    if (node != null) {
      const el = autosize(node);
      return () => {
        autosize.destroy(el);
      };
    }
  }, [textareaNodeRef]);

  function clearHistory(event: any) {
    event.preventDefault();
    setPrintHistory([]);
  }

  function loadJob(event: any, job: PrintJob) {
    event.preventDefault();
    const node = textareaNodeRef.current;
    if (node != null) {
      node.value = job.text;
    }
  }

  function clearTextarea(event: any) {
    event.preventDefault();
    const node = textareaNodeRef.current;
    if (node != null) {
      node.value = "";
    }
  }

  function onSubmit(event: any) {
    event.preventDefault();
    const node = textareaNodeRef.current;
    const text = (node?.value ?? "").trim();
    if (text.length > 0) {
      print(text)
        .then((job) => {
          setPrintHistory([job, ...printHistory]);
          if (node != null) {
            node.value = "";
          }
        })
        .catch(() => {
          console.error("failed to print");
        });
    }
  }

  return (
    <div className="App">
      <img
        src={logo}
        className={"App-logo " + (isPrinterOnline ? "" : "App-logo-monochrome")}
        alt="logo"
      />

      {/* {isPrinterOnline ? null : (
        <div>Printer offline, attempting to connect...</div>
      )} */}
      <form className="App-form" onSubmit={onSubmit}>
        <label className="App-hidden" htmlFor="text">
          Text to print:
        </label>
        <textarea
          disabled={!isPrinterOnline}
          className="App-text"
          id="text"
          ref={textareaNodeRef}
        ></textarea>
        <div>
          <input
            disabled={!isPrinterOnline}
            type="submit"
            className={
              "App-form-button button button-primary " +
              (isPrinterOnline ? "" : "disabled")
            }
            value="Print"
          />
          <input
            disabled={!isPrinterOnline}
            type="button"
            className={
              "App-form-buttom button" + (isPrinterOnline ? "" : "disabled")
            }
            onClick={clearTextarea}
            value="Clear"
          />
        </div>
      </form>
      <ul className="App-history">
        {printHistory.map((job) => {
          return (
            <li className="App-li" key={job.id}>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#" onClick={(e) => loadJob(e, job)} className="App-job">
                <span className="App-job-text">{job.text}</span>
                <span className="App-job-date">
                  {moment(job.date).fromNow()}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a className="App-clearHistory button" href="#" onClick={clearHistory}>
        Clear History
      </a>
    </div>
  );
}

export default App;
