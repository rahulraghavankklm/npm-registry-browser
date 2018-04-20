import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "material-ui/styles";
import Typography from "material-ui/Typography";
import Downshift from "downshift";
import { compose } from "recompose";

import animatedScrollTo from "animated-scrollto";

import Loader from "./Loader";
import { withWindowInfos } from "./WindowInfos";
import { debounce } from "../utils/helpers";

const styles = theme => ({
  rootWrapper: {
    position: "relative",
    display: "block",
    [theme.breakpoints.down("sm")]: {
      width: "90vw"
    },
    [theme.breakpoints.up("sm")]: {
      width: "80vw"
    },
    [theme.breakpoints.up("md")]: {
      width: "60vw"
    },
    margin: "0 auto"
  },
  input: {
    width: "100%",
    backgroundColor: "#ececec",
    border: 0,
    padding: 16,
    fontSize: "1.1rem",
    fontWeight: 500,
    fontFamily: `"Roboto", "Arial", sans-serif`,
    borderRadius: 5,
    outline: "none"
  },
  itemsWrapper: {
    padding: 0,
    margin: 0,
    position: "absolute",
    zIndex: 2,
    left: 0,
    right: 0,
    border: "1px solid rgba(34,36,38,.15)",
    overflowY: "scroll",
    [theme.breakpoints.down("sm")]: {
      maxHeight: 200
    },
    [theme.breakpoints.up("sm")]: {
      maxHeight: 450
    },
    "& li:last-child": {
      border: 0
    }
  },
  item: {
    padding: "8px 16px",
    borderBottom: "1px solid #ececec",
    cursor: "pointer"
  },
  safeItem: {
    maxWidth: "80%",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  },
  itemName: {
    fontWeight: "bold",
    "& > em": {
      fontWeight: "normal",
      fontStyle: "normal"
    }
  },
  itemDescription: {},
  itemVersion: {
    textAlign: "right",
    marginTop: -24
  },
  // following are the classes to override the CustomLoader
  customLoaderMessage: {
    display: "none"
  },
  customLoaderRoot: {
    verticalAlign: "center",
    padding: "O auto"
  },
  progress: {
    width: 50,
    margin: "-10px auto 10px"
  }
});

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = { items: [], inputValue: "" };
    this.inputEl = null;
  }
  componentDidMount() {
    window.addEventListener("touchstart", this.blurInputOnTouchOut, false);
  }
  componentWillUnmount() {
    window.removeEventListener("touchstart", this.blurInputOnTouchOut);
  }
  /**
   * On iOs, clicking out doesn't blur the search field (neither close the search dropdown)
   * This fixes it
   */
  blurInputOnTouchOut = event => {
    // go up the DOM tree from the touch to check if we are in the dropdown
    const ulAncestor = event.target.closest("ul") || { dataset: { type: {} } };
    // only trigger blur if touch not in input or in dropdown
    if (
      this.inputEl &&
      event.target !== this.inputEl &&
      ulAncestor.dataset.type !== "search-results"
    ) {
      this.inputEl.blur();
    }
  };
  debouncedSearch = debounce(
    value =>
      this.props
        .fetchInfos(value)
        .then(items => {
          this.setState({ items, state: "loaded" });
        })
        .catch(e => {
          console.error(e);
          this.setState({
            items: [],
            state: "error"
          });
        }),
    300
  );
  render() {
    const { goToPackage, windowInfos, classes, theme } = this.props;
    const { inputValue, items, state } = this.state;
    return (
      <Downshift
        itemToString={item => (item && item.package && item.package.name) || ""}
        onChange={item => {
          this.setState({
            inputValue: "" // reset the value of the controlled input
          });
          if (this.inputEl) {
            this.inputEl.blur();
          }
          goToPackage(item.package.name);
        }}
        render={({
          selectedItem,
          getInputProps,
          getItemProps,
          highlightedIndex,
          isOpen
        }) => (
          <div className={classes.rootWrapper}>
            <input
              data-testid="search-input"
              ref={node => {
                this.inputEl = node;
              }}
              className={classes.input}
              {...getInputProps({
                value: inputValue,
                placeholder: "Search packages",
                onChange: event => {
                  const value = event.target.value;
                  // the API only answer to queries with 2 chars or more
                  if (value.length > 1) {
                    this.setState(
                      {
                        inputValue: value, // keep track of the value of the input
                        state: "loading"
                      },
                      () => this.debouncedSearch(value)
                    );
                  } else {
                    this.setState({
                      inputValue: value, // keep track of the value of the input
                      items: []
                    });
                  }
                },
                onFocus: () => {
                  // on mobile, the keyboard will pop up. Give it some space
                  if (windowInfos.windowWidth < theme.breakpoints.values.sm) {
                    setTimeout(() => {
                      animatedScrollTo(document.body, 75, 400);
                    }, 75);
                  }
                }
              })}
            />
            {["loading", "error"].includes(state) && (
              <ul className={classes.itemsWrapper} data-type="search-results">
                <li
                  data-testid="search-loading-indicator"
                  className={classes.item}
                  style={{
                    backgroundColor: "white"
                  }}
                >
                  {state === "loading" ? (
                    <Loader
                      message=""
                      overrideClasses={{
                        customLoaderMessage: classes.customLoaderMessage,
                        customLoaderRoot: classes.customLoaderRoot,
                        progress: classes.progress
                      }}
                    />
                  ) : (
                    "error"
                  )}
                </li>
              </ul>
            )}
            {isOpen &&
              state === "loaded" &&
              items &&
              items.length > 0 && (
                <ul className={classes.itemsWrapper} data-type="search-results">
                  {items.map((item, index) => (
                    <li
                      data-testid={`search-result-${index}`}
                      key={item.package.name}
                      className={classes.item}
                      {...getItemProps({
                        item,
                        style: {
                          backgroundColor:
                            highlightedIndex === index ? "#ececec" : "white",
                          fontWeight: selectedItem === item ? "bold" : "normal"
                        }
                      })}
                    >
                      <Typography
                        variant="subheading"
                        className={`${classes.itemName} ${classes.safeItem}`}
                        dangerouslySetInnerHTML={{ __html: item.highlight }}
                      />
                      <Typography
                        className={`${classes.itemDescription} ${
                          classes.safeItem
                        }`}
                      >
                        {item.package.description}
                      </Typography>
                      <Typography className={classes.itemVersion}>
                        {item.package.version}
                      </Typography>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )}
      />
    );
  }
}

Search.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  fetchInfos: PropTypes.func.isRequired,
  goToPackage: PropTypes.func.isRequired,
  windowInfos: PropTypes.object.isRequired
};

export default compose(
  withStyles(styles, { withTheme: true }),
  withWindowInfos()
)(Search);
