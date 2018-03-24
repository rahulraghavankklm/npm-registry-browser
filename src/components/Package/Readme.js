import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "material-ui/styles";

import Markdown from "../Markdown";

import "./Readme.css";

const styles = theme => ({
  root: {
    flexGrow: 1
  },
  heading: {
    fontSize: theme.typography.pxToRem(12)
  },
  bookIcon: {
    verticalAlign: "middle",
    marginRight: "8px"
  },
  markdown: {
    [theme.breakpoints.down("sm")]: {
      // on small screens, limit the maxWidth to 80% of the width of the window (vw unit)
      // so that <pre> tags in readme have specific width to overflow: scroll when
      // piece of code exemple is to wide
      maxWidth: "80vw"
    },
    [theme.breakpoints.up("sm")]: {
      maxWidth: "58vw" // adjust for regular screens
    },
    [theme.breakpoints.up("md")]: {
      maxWidth: "64vw" // adjust for regular screens
    }
  }
});

const Readme = ({ classes, source }) => (
  <Markdown
    source={source}
    className={`Readme-markdown__root ${classes.markdown}`}
  />
);

Readme.propTypes = {
  classes: PropTypes.object.isRequired,
  source: PropTypes.string
};
Readme.defaultProps = {
  source: ""
};

export default withStyles(styles)(Readme);
